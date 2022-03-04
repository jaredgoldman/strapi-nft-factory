# Strapi NFT Factory

Utilizing the incredible [haslips art-engine](https://github.com/HashLips/hashlips_art_engine) to create a Strapi-powered UI for NFT creators to easily generate, store and mint single or multiple NFTs. Currently supports ALGO NFTs - working towards supporting ETH and SOL networks.

Strapi uses controllers and services to implement logic. You can find the generator/strapi implementation in `src/api/nft/controllers/generator`. From there `nft/services` are used to perform various tasks including generating, minting and uploading to IFPS.

# Get Started

Simply clone down this repo, run `npm i` and run locally using `npm run dev`. Once you've got the server spinned up, register as a user and add NFT collections, layers, assets and configurations. Once you've added the data you can send a request to the `api/generate` endpoint and watch the magic happen :).
