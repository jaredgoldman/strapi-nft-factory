module.exports = {
  routes: [
    {
      method: "GET",
      path: "/generate",
      handler: "generator.createNft",
    },
  ],
}
