import "react-native-get-random-values";
import * as ExpoCrypto from "expo-crypto";

// Some libs check for globalThis.crypto
if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = ExpoCrypto as any;
}