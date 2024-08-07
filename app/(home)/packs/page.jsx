"use client";
import React, { useEffect, useState } from "react";
import Footersection from "../components/homepage/footersection";
import Navbar from "../components/navbar";
import SearchSection from "./components/SearchSection";
import PackSection from "./components/PackSection";
import {
  collection,
  getDocs,
  limit,
  query,
  where,
  orderBy,
  getCountFromServer,
  startAfter,
} from "@firebase/firestore";
import { db } from "@/app/firebase/firebaseinit";
import { PackageCardSkeleton } from "../components/cardSkeleton";

const PAGE_SIZE = 20;
const Page = () => {
  const [packData, setPackData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("");
  const [lastDoc, setLastDoc] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const getPacksTotalCount = async () => {
    try {
      const q = query(collection(db, "packages"));
      const snapshot = await getCountFromServer(q);
      setTotalCount(snapshot.data().count);
    } catch (error) {
      console.log("Error getting document count: ", error);
      return null;
    }
  };

  const getPacks = async (lastDocRef = null) => {
    const resList = [];
    try {
      let daysInInt = null;
      if (days) daysInInt = parseInt(days);
      let q = query(collection(db, "packages"), limit(PAGE_SIZE));
      if (destination && !days) {
        q = query(
          collection(db, "packages"),
          where("state", "==", destination),
          limit(PAGE_SIZE)
        );
      } else if (days && !destination) {
        q = query(
          collection(db, "packages"),
          where("totalDays", "<=", daysInInt),
          orderBy("totalDays", "desc"),
          limit(PAGE_SIZE)
        );
      } else if (days && destination) {
        q = query(
          collection(db, "packages"),
          where("state", "==", destination),
          where("totalDays", "<=", daysInInt),
          orderBy("totalDays", "desc"),
          limit(PAGE_SIZE)
        );
      }
      if (lastDocRef) {
        q = query(q, startAfter(lastDocRef));
      }
      const res = await getDocs(q);
      setLastDoc(res.docs[res.docs.length - 1]);

      res.forEach((doc) => {
        resList.push({ id: doc.id, ...doc.data() });
      });
      if (lastDocRef) {
        setPackData((prev) => [...prev, ...resList]);
      } else {
        setPackData(resList);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const loadMore = async () => {
    await getPacks(lastDoc);
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await getPacks();
      await getPacksTotalCount();
      setIsLoading(false);
    })();
  }, []);
  return (
    <div className="">
      <Navbar />
      <SearchSection
        filter={getPacks}
        destination={destination}
        setDestination={setDestination}
        days={days}
        setDays={setDays}
      />
      {isLoading ? (
        <div className="max-w-5xl mx-auto">
          <PackageCardSkeleton />
          <PackageCardSkeleton />
          <PackageCardSkeleton />
          <PackageCardSkeleton />
        </div>
      ) : (
        <PackSection packs={packData} />
      )}
      <p>{totalCount}</p>
      {packData.length < totalCount && (
        <div className="flex justify-center mb-10">
          <button
            className="py-2 px-10 rounded-md bg-green-900 text-white font-semibold hover:scale-105 hover:shadow-xl"
            onClick={loadMore}
          >
            Load More
          </button>
        </div>
      )}
      <Footersection />
    </div>
  );
};

export default Page;
