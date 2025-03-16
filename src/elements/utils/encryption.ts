import * as age from "age-encryption";
import { privateKey } from "../../login";

const ageEncrypter = new age.Encrypter();
const pubKeys = JSON.parse(
  localStorage.getItem("allowed-public-keys-age") || "[]",
);
for (const key of pubKeys) {
  ageEncrypter.addRecipient(key);
}

const ageDecrypter = new age.Decrypter();
ageDecrypter.addIdentity(privateKey);

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const compressUint8Array = async (array: Uint8Array) => {
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(array);
  writer.close();
  const compressed = await new Response(cs.readable).arrayBuffer();
  const uint8Array = new Uint8Array(compressed);
  return uint8Array;
};

export const ageEncrypt = async (text: string) => {
  const encryptedText = await ageEncrypter.encrypt(text);
  return age.armor.encode(encryptedText);
};

export const compressedAgeEncrypt = async (text: string) => {
  const byteArray = textEncoder.encode(text);
  const compressedArray = await compressUint8Array(byteArray);
  const compressedText = textDecoder.decode(compressedArray);

  const encryptedText = await ageEncrypter.encrypt(compressedText);
  return age.armor.encode(encryptedText);
};

export const ageDecrypt = async (text: string) => {
  const decryptedText = await ageDecrypter.decrypt(
    age.armor.decode(text),
    "text",
  );

  return decryptedText;
};
