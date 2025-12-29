import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { spawn } from "child_process";

export const runtime = "nodejs";

const handler = createMcpHandler(
  async (server) => {
    server.tool(
      "do-nuclei",
      "Execute Nuclei, an advanced vulnerability scanner using YAML templates. Runs the nuclei binary inside the container and returns the raw output.",
      {
        url: z.string().url().describe("Target URL to scan with nuclei"),
        tags: z.array(z.string()).optional().describe("Comma-separated tags list; e.g. [\"cves\", \"exposures\"]"),
      },
      async ({ url, tags }) => {
        const args: string[] = ["-u", url, "-silent"];
        if (tags && tags.length > 0) {
          args.push("-tags", tags.join(","));
        }

        return new Promise((resolve, reject) => {
          const proc = spawn("nuclei", args, { env: process.env });
          let stdout = "";
          let stderr = "";

          proc.stdout.on("data", (data) => {
            stdout += data.toString();
          });

          proc.stderr.on("data", (data) => {
            stderr += data.toString();
          });

          proc.on("close", (code) => {
            if (code === 0) {
              resolve({
                content: [
                  {
                    type: "text",
                    text: stdout.trim() || "Nuclei completed with no stdout output.",
                  },
                ],
              });
            } else {
              reject(new Error(`nuclei exited with code ${code}: ${stderr || stdout}`));
            }
          });

          proc.on("error", (err) => {
            reject(new Error(`Failed to start nuclei: ${err.message}`));
          });
        });
      }
    );

    server.tool(
      "get-nuclei-tags",
      "Fetch the latest list of official nuclei template tags from ProjectDiscovery.",
      {},
      async () => {
        try {
          const response = await fetch(
            "https://raw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/TEMPLATES-STATS.json"
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch tags: ${response.status} ${response.statusText}`);
          }
          const data = (await response.json()) as { tags: { name: string }[] };
          const tagNames = data.tags.map((tag) => tag.name);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(tagNames),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error retrieving nuclei tags: ${error.message}`,
              },
            ],
          };
        }
      }
    );
  },
  {
    capabilities: {
      tools: {
        "do-nuclei": {
          description:
            "Execute Nuclei vulnerability scanner with optional template tags and return the raw scan output.",
        },
        "get-nuclei-tags": {
          description: "Retrieve the official nuclei template tag list.",
        },
      },
    },
  },
  {
    basePath: "",
    verboseLogs: true,
    maxDuration: 300,
    disableSse: true,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
