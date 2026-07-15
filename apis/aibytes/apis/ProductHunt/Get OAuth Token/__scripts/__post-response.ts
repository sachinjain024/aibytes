rq.test("Token request succeeded", () => {
  rq.response.to.have.status(200);
});

const { access_token } = rq.response.json();
if (access_token) {
  rq.environment.set("ph_access_token", access_token);
  console.log("Saved ph_access_token to the active environment");
}
