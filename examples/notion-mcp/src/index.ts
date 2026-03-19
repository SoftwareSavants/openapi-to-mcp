import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getApiConfig } from "./auth.js";
import type { ApiConfig } from "./types.js";

import * as retrieveAblock from "./tools/retrieve_ablock.js";
import * as updateAblock from "./tools/update_ablock.js";
import * as deleteAblock from "./tools/delete_ablock.js";
import * as retrieveBlockChildren from "./tools/retrieve_block_children.js";
import * as appendBlockChildren from "./tools/append_block_children.js";
import * as retrieveComments from "./tools/retrieve_comments.js";
import * as retrieveAdatabase from "./tools/retrieve_adatabase.js";
import * as updateAdatabase from "./tools/update_adatabase.js";
import * as queryAdatabase from "./tools/query_adatabase.js";
import * as retrieveApage from "./tools/retrieve_apage.js";
import * as updatePageProperties from "./tools/update_page_properties.js";
import * as retrieveApagePropertyItem from "./tools/retrieve_apage_property_item.js";
import * as retrieveAuser from "./tools/retrieve_auser.js";

function createServer(getConfig: () => ApiConfig): McpServer {
  const server = new McpServer({
    name: "notion-api",
    version: "1.0.0",
  });

  server.registerTool(retrieveAblock.name, {
    description: retrieveAblock.description,
    inputSchema: retrieveAblock.params,
  }, async (args) => retrieveAblock.handler(args, getConfig()));

  server.registerTool(updateAblock.name, {
    description: updateAblock.description,
    inputSchema: updateAblock.params,
  }, async (args) => updateAblock.handler(args, getConfig()));

  server.registerTool(deleteAblock.name, {
    description: deleteAblock.description,
    inputSchema: deleteAblock.params,
  }, async (args) => deleteAblock.handler(args, getConfig()));

  server.registerTool(retrieveBlockChildren.name, {
    description: retrieveBlockChildren.description,
    inputSchema: retrieveBlockChildren.params,
  }, async (args) => retrieveBlockChildren.handler(args, getConfig()));

  server.registerTool(appendBlockChildren.name, {
    description: appendBlockChildren.description,
    inputSchema: appendBlockChildren.params,
  }, async (args) => appendBlockChildren.handler(args, getConfig()));

  server.registerTool(retrieveComments.name, {
    description: retrieveComments.description,
    inputSchema: retrieveComments.params,
  }, async (args) => retrieveComments.handler(args, getConfig()));

  server.registerTool(retrieveAdatabase.name, {
    description: retrieveAdatabase.description,
    inputSchema: retrieveAdatabase.params,
  }, async (args) => retrieveAdatabase.handler(args, getConfig()));

  server.registerTool(updateAdatabase.name, {
    description: updateAdatabase.description,
    inputSchema: updateAdatabase.params,
  }, async (args) => updateAdatabase.handler(args, getConfig()));

  server.registerTool(queryAdatabase.name, {
    description: queryAdatabase.description,
    inputSchema: queryAdatabase.params,
  }, async (args) => queryAdatabase.handler(args, getConfig()));

  server.registerTool(retrieveApage.name, {
    description: retrieveApage.description,
    inputSchema: retrieveApage.params,
  }, async (args) => retrieveApage.handler(args, getConfig()));

  server.registerTool(updatePageProperties.name, {
    description: updatePageProperties.description,
    inputSchema: updatePageProperties.params,
  }, async (args) => updatePageProperties.handler(args, getConfig()));

  server.registerTool(retrieveApagePropertyItem.name, {
    description: retrieveApagePropertyItem.description,
    inputSchema: retrieveApagePropertyItem.params,
  }, async (args) => retrieveApagePropertyItem.handler(args, getConfig()));

  server.registerTool(retrieveAuser.name, {
    description: retrieveAuser.description,
    inputSchema: retrieveAuser.params,
  }, async (args) => retrieveAuser.handler(args, getConfig()));

  return server;
}

async function main() {
  const mode = process.argv.includes("--http") ? "http" : "stdio";

  if (mode === "http") {
    const { startHttp } = await import("./transports/http.js");
    await startHttp(createServer);
  } else {
    const config = getApiConfig();
    const server = createServer(() => config);
    const { startStdio } = await import("./transports/stdio.js");
    await startStdio(server);
  }
}

main().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
