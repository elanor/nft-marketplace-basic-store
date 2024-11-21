"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import Image from "next/image";
import { Sun, Moon } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import dynamic from "next/dynamic";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const DynamicWalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

const NavBar = () => {
  const { theme, toggleTheme } = useTheme();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [username, setUsername] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("http://localhost:4000/api/userinfo", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setUsername(response.data.username);
        })
        .catch(() => {
          setUsername(null);
        });
    }
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey) {
        try {
          const balanceInLamports = await connection.getBalance(publicKey);
          setBalance(balanceInLamports / LAMPORTS_PER_SOL); 
        } catch (error) {
          console.error("Error fetching wallet balance:", error);
        }
      } else {
        setBalance(null); 
      }
    };

    fetchBalance();
  }, [publicKey, connection]);

  const handleToggleTheme = () => {
    toggleTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <nav className="bg-black p-4 fixed w-full top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-white text-xl font-bold">Defy</div>
        </Link>
        <div className="space-x-4 flex items-center">
          <Link href="/dashboard" className="text-white hidden sm:inline">
            Profile
          </Link>
          <Link href="/studio" className="text-white hidden sm:inline">
            Studio
          </Link>
          <Link href="/discover" className="text-white hidden sm:inline">
            Discover
          </Link>
          <Link href="/discover/closet" className="text-white hidden sm:inline">
            Closet
          </Link>
          <Link href="/marketplace" className="text-white hidden sm:inline">
            Market
          </Link>
          <button
            onClick={handleToggleTheme}
            className="bg-black text-white px-2 py-1 rounded flex items-center justify-center"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-white" />
            ) : (
              <Sun className="w-5 h-5 text-white" />
            )}
          </button>
          {publicKey && (
            <div className="text-white text-sm font-semibold">
              {balance !== null ? `${balance.toFixed(2)} SOL` : "Loading..."}
            </div>
          )}
          <DynamicWalletMultiButton />
        </div>
      </div>
      <div className="container mx-auto flex justify-between items-center sm:hidden mt-2">
        <Link href="/dashboard" className="text-white">
          Profile
        </Link>
        <Link href="/studio" className="text-white">
          Studio
        </Link>
        <Link href="/discover" className="text-white">
          Discover
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
