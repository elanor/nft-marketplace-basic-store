import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddress,
  getTokenMetadata,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { WalletAdapterProps } from "@solana/wallet-adapter-base";
import { SolanaNftMarketplace, IDL } from "./types/solana_nft_marketplace";

const PREFIX = "MARKETPLACE";
const programId = new PublicKey("FX2TuF4AsoxvbkNC95CK5RGdkpdMWFsPszULZy68Kexp");

async function loadProgram(connection: Connection, provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);
  return new anchor.Program<SolanaNftMarketplace>(IDL, programId);
}

export async function getNFTList(
  provider: anchor.AnchorProvider,
  connection: Connection,
  filters: {
    collection?: string;
    collectionCategory?: string; 
    priceRange?: { min: number; max: number };
    category?: string;
    type?: string;
  } = {}
) {
  const program = await loadProgram(connection, provider);

  const listingAccounts = await provider.connection.getProgramAccounts(programId, {
    filters: [{ dataSize: 80 + 8 }],
  });

  const listings = listingAccounts.map((account) => {
    const listingData = program.account.listing.coder.accounts.decode(
      "listing",
      account.account.data
    );

    return {
      pubkey: account.pubkey.toString(),
      seller: listingData.seller.toString(),
      price: listingData.price.toNumber(),
      mint: listingData.mint.toString(),
      isActive: listingData.isActive,
      collection: listingData.collection || "",
      category: listingData.category || "",
      type: listingData.type || "",
      collectionCategory: listingData.collectionCategory || "", 
    };
  });

  // Apply filters with default values
  const filteredListings = listings.filter((listing) => {
    if (filters.collection && listing.collection !== filters.collection) return false;
    if (filters.collectionCategory && listing.collectionCategory !== filters.collectionCategory)
      return false;
    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      if (listing.price < min || listing.price > max) return false;
    }
    if (filters.category && listing.category !== filters.category) return false;
    if (filters.type && listing.type !== filters.type) return false;
    return true;
  });

  return filteredListings;
}

export async function getNFTDetail(
  mint: PublicKey,
  connection: Connection,
  seller: string,
  price: string,
  listing: string
) {
  try {
    const metadata = await getTokenMetadata(
      connection,
      mint,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    if (!metadata?.uri) {
      console.warn("Metadata URI is missing.");
      return null;
    }

    const imageExtensions = ["jpeg", "png", "jpg"];
    let image_url = "";

    if (imageExtensions.some((ext) => metadata.uri.endsWith(ext))) {
      image_url = metadata.uri || "";
    } else {
      const response = await fetch(metadata.uri || "");
      if (response.ok) {
        const res_data = await response.json();
        image_url = res_data.image;
      }
    }

    return {
      name: metadata.name || "",
      symbol: metadata.symbol || "",
      mint: mint.toString(),
      group: metadata.additionalMetadata?.[0]?.[1] || "",
      image: image_url,
      seller: seller,
      price: price,
      listing: listing,
    };
  } catch (error) {
    console.error("Error fetching NFT details:", error);
    return null;
  }
}
