"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
const namespace_wrapper_1 = require("@_koii/namespace-wrapper");
require("dotenv/config");
const os_1 = __importDefault(require("os"));
const podId = namespace_wrapper_1.TASK_ID;
// You will get this imageURL after building the image (in the docker-container folder) and pushing it to Docker Hub
const imageUrl = "docker.io/labrocadabro/orca-hello-world:1.1";
function getHostIP() {
    const interfaces = os_1.default.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            // Skip over internal (i.e., 127.0.0.1) and non-IPv4 addresses
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    throw new Error("Unable to determine host IP address");
}
function createPodSpec() {
    return __awaiter(this, void 0, void 0, function* () {
        const basePath = yield namespace_wrapper_1.namespaceWrapper.getBasePath();
        /** EXAMPLE PODSPEC
       *
       * NOTES:
       * The spacing is critical in YAML files
       * We recommend validating your podSpec with a tool like https://www.yamllint.com/
       * Use a template literal (``) to preserve whitespace
       * Do not change containers > name
       * You must specify your container image in the podSpec
       */
        const podSpec = `apiVersion: v1
kind: Pod
metadata:
  name: 247-builder-test
spec:
  containers:
    - name: user-${podId}
      image: ${imageUrl}
      env:
      - name: YOUR ENV VARIABLE
        value: "${process.env.YOUR_ENV_VARIABLE}"
      volumeMounts:
        - name: data-volume
          mountPath: /data
  volumes:
    - name: builder-data
      hostPath:
        path: ${basePath}/orca/data
        type: DirectoryOrCreate
  hostAliases:
  - ip: "${getHostIP()}"
    hostnames:
    - "host.docker.internal"
`;
        return podSpec;
    });
}
function getConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            imageURL: imageUrl,
            customPodSpec: yield createPodSpec(),
            rootCA: null,
            timeout: 900000,
        };
    });
}
