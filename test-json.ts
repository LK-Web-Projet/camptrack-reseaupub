const openApi = {
  test: "value",
  components: {
    schemas: {
      Test: { type: "string" }
    },
    responses: {
      OK: { description: "OK" }
    }
  }
};

export async function GET() {
  return openApi;
}
