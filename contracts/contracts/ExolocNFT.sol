// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Remix-compatible import — fetched automatically via Remix's npm resolver.
// Hardhat resolves the same path from node_modules/@openzeppelin/contracts.
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * ExolocNFT — Exolocation Deed ERC-721
 *
 * One token = one 40-acre virtual land deed on a confirmed exoplanet,
 * permanently anchored to a PON INK coordinate address
 * (e.g. exo-surface-v1:Kepler-442b:14N,23W).
 *
 * Permissionless on testnet — anyone may call safeMint.
 * Add Ownable / AccessControl before mainnet deployment.
 */
contract ExolocNFT is ERC721URIStorage {

    uint256 private _nextTokenId;

    event ExolocMinted(
        address indexed to,
        uint256 indexed tokenId,
        string  uri
    );

    constructor() ERC721("Exolocation Deed", "EXOLOC") {}

    /**
     * Mint a new Exolocation Deed.
     * @param to  Recipient wallet address.
     * @param uri Token URI — ipfs://<CID> or data URI for testnet.
     * @return tokenId The ID of the newly minted token.
     */
    function safeMint(address to, string memory uri) public returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit ExolocMinted(to, tokenId, uri);
    }

    /** Total tokens minted (useful for indexers and the mint page counter). */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}
