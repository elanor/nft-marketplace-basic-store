"use client";

import React, { useEffect, useState } from "react";
import { getNFTDetail, getNFTList } from "@/utils/nftMarket";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import Image from "next/image";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";
import { FaExternalLinkAlt } from "react-icons/fa";
import { AnchorProvider } from "@coral-xyz/anchor";

export interface NFTDetail {
  name: string;
  symbol: string;
  image?: string;
  group?: string;
  mint: string;
  seller: string;
  price: string;
  listing: string;
}

const Closet: React.FC = () => {
  const [assets, setAssets] = useState<NFTDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    collection: "",
    collectionCategory: "",
    priceRange: { min: null, max: null }, 
    category: "",
    type: "",
  });
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  // Example options
  const categoryOptions = ["Featured", "Trending", "New Releases", "Limited Edition"];
  const typeOptions = ["Dresses", "Shirts", "Trousers"];
  const collectionCategoryOptions = [
    "Collection 1",
    "Collection 2",
    "Collection 3",
    "Collection 4",
  ];

  useEffect(() => {
    fetchNFTs();
  }, [wallet, filters]);

  const fetchNFTs = async () => {
    setIsLoading(true);
    const provider = new AnchorProvider(connection, wallet!, {});

    try {
      const listings = await getNFTList(provider, connection);
      const filteredListings = listings
        .filter((list) => list.isActive)
        .filter((list) => {
          // Apply filters conditionally
          if (filters.collection && list.collection !== filters.collection)
            return false;
          if (
            filters.collectionCategory &&
            list.collectionCategory !== filters.collectionCategory
          )
            return false;

          const priceInSOL = list.price / 1_000_000; // Assuming price is in lamports
          if (
            filters.priceRange.min !== null &&
            priceInSOL < filters.priceRange.min
          )
            return false;
          if (
            filters.priceRange.max !== null &&
            priceInSOL > filters.priceRange.max
          )
            return false;
          if (filters.category && list.category !== filters.category)
            return false;
          if (filters.type && list.type !== filters.type) return false;

          return true;
        })
        .map((list) => {
          const mint = new PublicKey(list.mint);
          return getNFTDetail(
            mint,
            connection,
            list.seller,
            list.price,
            list.pubkey
          );
        });

      const detailedListings = await Promise.all(filteredListings);
      setAssets(detailedListings);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const trimAddress = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <div className="p-4 pt-20 bg-white dark:bg-black min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-center text-black dark:text-white">
        NFTs on Sale
      </h1>

      {/* Filter UI */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select
          className="p-2 border rounded"
          value={filters.collectionCategory}
          onChange={(e) =>
            setFilters({ ...filters, collectionCategory: e.target.value })
          }
        >
          <option value="">Collection</option>
          {collectionCategoryOptions.map((collectionCategory) => (
            <option key={collectionCategory} value={collectionCategory}>
              {collectionCategory}
            </option>
          ))}
        </select>

        <input
          className="p-2 border rounded no-arrows"
          placeholder="Min Price"
          type="number"
          value={filters.priceRange.min === null ? "" : filters.priceRange.min}
          onChange={(e) =>
            setFilters({
              ...filters,
              priceRange: {
                ...filters.priceRange,
                min: e.target.value === "" ? null : Number(e.target.value),
              },
            })
          }
        />
        <input
          className="p-2 border rounded no-arrows"
          placeholder="Max Price"
          type="number"
          value={filters.priceRange.max === null ? "" : filters.priceRange.max}
          onChange={(e) =>
            setFilters({
              ...filters,
              priceRange: {
                ...filters.priceRange,
                max: e.target.value === "" ? null : Number(e.target.value),
              },
            })
          }
        />

        <select
          className="p-2 border rounded"
          value={filters.category}
          onChange={(e) =>
            setFilters({ ...filters, category: e.target.value })
          }
        >
          <option value="">Category</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          className="p-2 border rounded"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">Type</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* NFTs Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="h-64 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : assets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((asset: NFTDetail) => (
            <div
              key={asset.mint}
              className="relative p-4 border rounded shadow hover:shadow-lg transition-transform transform hover:scale-105 cursor-pointer bg-white dark:bg-black group"
            >
              <Link href={`/marketplace/${asset.mint}`}>
                <div className="relative h-64 w-full mb-4">
                  {asset.image ? (
                    <Image
                      src={asset.image}
                      alt={`Asset ${asset.mint}`}
                      layout="fill"
                      objectFit="contain"
                      className="rounded"
                    />
                  ) : (
                    <p>No Image Available</p>
                  )}
                </div>
              </Link>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-opacity flex flex-col justify-end items-center opacity-0 group-hover:opacity-100 text-white text-xs p-2">
                <p className="font-semibold">{asset.name || "Unknown"}</p>
                <Link
                  href={`https://solana.fm/address/${asset.mint}`}
                  target="_blank"
                  className="hover:text-gray-300 flex items-center"
                >
                  {trimAddress(asset.mint)}{" "}
                  <FaExternalLinkAlt className="ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <h2 className="text-2xl font-bold mb-4 text-center text-red-500 dark:text-yellow">
          No NFTs on sale
        </h2>
      )}
    </div>
  );
};

export default Closet;
