import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getApiConfig } from "./auth.js";
import type { ApiConfig } from "./types.js";

import * as addPet from "./tools/add_pet.js";
import * as updatePet from "./tools/update_pet.js";
import * as findPetsByStatus from "./tools/find_pets_by_status.js";
import * as findPetsByTags from "./tools/find_pets_by_tags.js";
import * as getPetById from "./tools/get_pet_by_id.js";
import * as updatePetWithForm from "./tools/update_pet_with_form.js";
import * as deletePet from "./tools/delete_pet.js";
import * as uploadFile from "./tools/upload_file.js";
import * as getInventory from "./tools/get_inventory.js";
import * as placeOrder from "./tools/place_order.js";
import * as getOrderById from "./tools/get_order_by_id.js";
import * as deleteOrder from "./tools/delete_order.js";
import * as createUser from "./tools/create_user.js";
import * as createUsersWithListInput from "./tools/create_users_with_list_input.js";
import * as loginUser from "./tools/login_user.js";
import * as logoutUser from "./tools/logout_user.js";
import * as getUserByName from "./tools/get_user_by_name.js";
import * as updateUser from "./tools/update_user.js";
import * as deleteUser from "./tools/delete_user.js";

function createServer(getConfig: () => ApiConfig): McpServer {
  const server = new McpServer({
    name: "swagger-petstore-openapi-3-0",
    version: "1.0.0",
  });

  server.registerTool(addPet.name, {
    description: addPet.description,
    inputSchema: addPet.params,
  }, async (args) => addPet.handler(args, getConfig()));

  server.registerTool(updatePet.name, {
    description: updatePet.description,
    inputSchema: updatePet.params,
  }, async (args) => updatePet.handler(args, getConfig()));

  server.registerTool(findPetsByStatus.name, {
    description: findPetsByStatus.description,
    inputSchema: findPetsByStatus.params,
  }, async (args) => findPetsByStatus.handler(args, getConfig()));

  server.registerTool(findPetsByTags.name, {
    description: findPetsByTags.description,
    inputSchema: findPetsByTags.params,
  }, async (args) => findPetsByTags.handler(args, getConfig()));

  server.registerTool(getPetById.name, {
    description: getPetById.description,
    inputSchema: getPetById.params,
  }, async (args) => getPetById.handler(args, getConfig()));

  server.registerTool(updatePetWithForm.name, {
    description: updatePetWithForm.description,
    inputSchema: updatePetWithForm.params,
  }, async (args) => updatePetWithForm.handler(args, getConfig()));

  server.registerTool(deletePet.name, {
    description: deletePet.description,
    inputSchema: deletePet.params,
  }, async (args) => deletePet.handler(args, getConfig()));

  server.registerTool(uploadFile.name, {
    description: uploadFile.description,
    inputSchema: uploadFile.params,
  }, async (args) => uploadFile.handler(args, getConfig()));

  server.registerTool(getInventory.name, {
    description: getInventory.description,
    inputSchema: getInventory.params,
  }, async (args) => getInventory.handler(args, getConfig()));

  server.registerTool(placeOrder.name, {
    description: placeOrder.description,
    inputSchema: placeOrder.params,
  }, async (args) => placeOrder.handler(args, getConfig()));

  server.registerTool(getOrderById.name, {
    description: getOrderById.description,
    inputSchema: getOrderById.params,
  }, async (args) => getOrderById.handler(args, getConfig()));

  server.registerTool(deleteOrder.name, {
    description: deleteOrder.description,
    inputSchema: deleteOrder.params,
  }, async (args) => deleteOrder.handler(args, getConfig()));

  server.registerTool(createUser.name, {
    description: createUser.description,
    inputSchema: createUser.params,
  }, async (args) => createUser.handler(args, getConfig()));

  server.registerTool(createUsersWithListInput.name, {
    description: createUsersWithListInput.description,
    inputSchema: createUsersWithListInput.params,
  }, async (args) => createUsersWithListInput.handler(args, getConfig()));

  server.registerTool(loginUser.name, {
    description: loginUser.description,
    inputSchema: loginUser.params,
  }, async (args) => loginUser.handler(args, getConfig()));

  server.registerTool(logoutUser.name, {
    description: logoutUser.description,
    inputSchema: logoutUser.params,
  }, async (args) => logoutUser.handler(args, getConfig()));

  server.registerTool(getUserByName.name, {
    description: getUserByName.description,
    inputSchema: getUserByName.params,
  }, async (args) => getUserByName.handler(args, getConfig()));

  server.registerTool(updateUser.name, {
    description: updateUser.description,
    inputSchema: updateUser.params,
  }, async (args) => updateUser.handler(args, getConfig()));

  server.registerTool(deleteUser.name, {
    description: deleteUser.description,
    inputSchema: deleteUser.params,
  }, async (args) => deleteUser.handler(args, getConfig()));

  return server;
}

async function main() {
  const mode = process.argv.includes("--http") ? "http"
    : process.argv.includes("--sse") ? "sse"
    : "stdio";

  if (mode === "http") {
    const { startHttp } = await import("./transports/http.js");
    await startHttp(createServer);
  } else if (mode === "sse") {
    const { startSse } = await import("./transports/sse.js");
    await startSse(createServer);
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
