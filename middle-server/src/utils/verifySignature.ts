import bs58 from "bs58";
import nacl from "tweetnacl";

async function bs58Decode(data: string): Promise<Uint8Array> {
  return new Uint8Array(bs58.decode(data));
}

function decodePayload(payload: Uint8Array): string {
  return new TextDecoder().decode(payload);
}

export async function verifySignature(
  signedMessage: string,
  stakingKey: string,
): Promise<{ data?: string; error?: string }> {
  try {
    const payload = nacl.sign.open(await bs58Decode(signedMessage), await bs58Decode(stakingKey));
    if (!payload) return { error: "Invalid signature" };
    return { data: decodePayload(payload) };
  } catch (e) {
    console.error(e);
    return { error: `Verification failed: ${e}` };
  }
}
