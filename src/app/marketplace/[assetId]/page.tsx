"use client";

import React, { useEffect, useState } from "react";
import { getNFTDetail } from "@/utils/nftMarket";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { PublicKey } from "@solana/web3.js";
import { FaExternalLinkAlt } from "react-icons/fa";

interface Product {
  name: string;
  symbol: string; 
  image: string;
  group: string;
  seller: string;
  price: string;
  listing: string;
}

interface Props {
  assetId: string; 
}

const ProductDetails: React.FC<Props> = ({ assetId }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  useEffect(() => {
    if (!assetId) return;

    const fetchProductDetails = async () => {
      try {
        const mint = new PublicKey(assetId); 
        const details = await getNFTDetail(
          mint,
          connection,
          "", 
          "", 
          ""  
        );

        if (details) {
          setProduct({
            name: details.name,
            symbol: details.symbol, // Ensure symbol is included here
            image: details.image,
            group: details.group,
            seller: details.seller,
            price: details.price,
            listing: details.listing,
          });
        
          setMainImage(details.image);
        } else {
          console.error("Failed to fetch details for NFT.");
        }

      } catch (error) {
        console.error("Error fetching product details:", error);
        setProduct(null);
      }
    };

    fetchProductDetails();
  }, [assetId, connection]);

  if (!product) {
    return <div>Loading product details...</div>;
  }

  return (
    <div className="p-4 pt-20 bg-white dark:bg-black min-h-screen">
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4 text-black dark:text-white">
          {product.name}
        </h1>
        {mainImage && (
          <Image
            src={mainImage}
            alt={product.name}
            width={400}
            height={400}
            className="object-contain rounded mb-4"
          />
        )}
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
          Seller: {product.seller}
        </p>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
          Price: {product.price}
        </p>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
          Group: {product.group}
        </p>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Listing: {product.listing}
        </p>
        <a
          href={`https://solana.fm/address/${product.listing}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline flex items-center mt-4"
        >
          View on Solana Explorer
          <FaExternalLinkAlt className="ml-2" />
        </a>
      </div>
    </div>
  );
};

export default ProductDetails;
