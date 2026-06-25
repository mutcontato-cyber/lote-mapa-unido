//#region \0%23tanstack-start-server-fn-resolver
var manifest = {
	"628e6bfcbd2fe41105d4b117b6102ce1909ee22804902345adbfcfcb76e73630": {
		functionName: "sendEvolutionWhatsApp_createServerFn_handler",
		importer: () => import("./admin.functions-AL3M0DCE.js")
	},
	"981ac9ddadec5c91e62824a4d9558c0ab53d0927823b4439320b0767bad2265e": {
		functionName: "deleteMorador_createServerFn_handler",
		importer: () => import("./admin.functions-AL3M0DCE.js")
	},
	"9880f8335159b0de86437796536ccc78ec65f7113eec5942898d71a407c6027d": {
		functionName: "generatePasswordReset_createServerFn_handler",
		importer: () => import("./admin.functions-AL3M0DCE.js")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
