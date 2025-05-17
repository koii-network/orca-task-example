import { TASK_ID, namespaceWrapper } from "@_koii/namespace-wrapper";
import "dotenv/config";
import os from "os";
const podId = TASK_ID;

// You will get this imageURL after building the image (in the docker-container folder) and pushing it to Docker Hub
const imageUrl = "docker.io/labrocadabro/orca-hello-world:1.1";

function getHostIP() {
  const interfaces = os.networkInterfaces();
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

async function createPodSpec(): Promise<string> {
  const basePath = await namespaceWrapper.getBasePath();

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
}

export async function getConfig(): Promise<{
  imageURL: string;
  customPodSpec: string;
  rootCA: string | null;
  timeout: number;
}> {
  return {
    imageURL: imageUrl,
    customPodSpec: await createPodSpec(),
    rootCA: null,
    timeout: 900000,
  };
}
