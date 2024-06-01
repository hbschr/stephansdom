import { mock } from "bun:test";

export const mockModule = async (name, obj) => {
  const module = await import(name);
  mock.module(name, () => Object.assign({ ...module }, obj));
};

await mockModule("./src/utils", {
  measureText: (str: string) => str.length,
});
