"use client";
import React, { useEffect, useState } from "react";
import {
  Dumbbell,
  Plus,
  TrendingUp,
  Calendar,
  Flame,
  ClockIcon,
  Trash2,
  Pencil,
  CheckCircle2,
  RotateCcw,
  Droplets,
  LoaderCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import ModalAddWater from "@/components/drinkwater/ModalAddWater";
import { API_URL, getToken } from "@/lib/api";
import { createClient } from "@/lib/supabase-client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";  

export default function DrinkWaterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  // Total water consumed today (milliliters)
  const [waterConsumedMl, setWaterConsumedMl] = useState<number>(0);
  // Daily goal (milliliters)
  const [dailyWaterGoalMl, setDailyWaterGoalMl] = useState<number>(0);


    const checkUser = useCallback(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      fetchTodayDrinkWater();
    }, [router]);
  
    useEffect(() => {
      checkUser();
    }, [checkUser]);


  const fetchHistoryDrinkWater = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/drinkwater/history`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log("Drink Water History:", data);
    } catch (error) {
      console.error("Failed to fetch drink water history:", error);
    }
  };

  
  const fetchTodayDrinkWater = async () => {
     try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/drinkwater/today`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log("Drink Water today:", data);
      setDailyWaterGoalMl(data.goal_ml);
      setWaterConsumedMl(data.total_ml);
    } catch (error) {
      console.error("Failed to fetch drink water history:", error);
    }
  };
  useEffect(() => {
    console.log("User changed:", user);
    console.log("dailyWaterGoalMl",dailyWaterGoalMl)
    console.log("waterConsumedMl",waterConsumedMl)
    fetchTodayDrinkWater();
  }, [user])
  
  fetchHistoryDrinkWater();


  let dailyProgressPercent = (waterConsumedMl / dailyWaterGoalMl) * 100;

  if (dailyProgressPercent > 100) dailyProgressPercent = 100;

  const [isAddWaterModalOpen, setIsAddWaterModalOpen] = useState(false);
  const waterPresetAmounts = [100, 200, 500, 1000];
  const [goalReached, setGoalReached] = useState(false);

  const t = useTranslations("dashboard");
  const applyDailyGoalChange = () => {
    // In a future integration, persist dailyWaterGoalMl via API.
    console.log("Daily water goal set to:", dailyWaterGoalMl);
  };
  return (
    <div className="min-h-screen bg-background p-6 pt-20 lg:pt-6 space-y-6">
      <div className=" ">
        {/* ========================================
            HEADER
            ======================================== */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Drink Water
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage your daily water intake and stay hydrated.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Calendar className="h-4 w-4" />
              View History
            </Button>
          </div>
        </div>
        <Card>
          <Button
            onClick={() => setIsAddWaterModalOpen(!isAddWaterModalOpen)}
            className="mb-4 mt-4 ml-4"
            variant="ghost"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Water
          </Button>
          <div>
            <input
              type="number"
              value={dailyWaterGoalMl}
              onChange={(e) => setDailyWaterGoalMl(Number(e.target.value))}
            />
            <Button onClick={applyDailyGoalChange}>
              Apply Daily Goal
            </Button>
          </div>

          <CardHeader></CardHeader>
          <CardContent>
            <div>

              {dailyWaterGoalMl === 0 ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                 <div
                className={` bg-gray-200 w-10 flex flex-col-reverse `}
                style={{ height: `${dailyWaterGoalMl / 10}px` }}
              >
                <div
                  className={` bg-blue-600 w-10`}
                  style={{ height: `${dailyProgressPercent}%` }}
                ></div>



                <div className="absolute ml-14">
                  <div className="flex">
                    <span className="text-nowrap mr-2">Daily Goal: </span>
                    {dailyWaterGoalMl}ml
                  </div>
                  <div className="flex">
                    <span className="text-nowrap mr-2">Consumed: </span>
                    {waterConsumedMl}ml
                  </div>
                  <div className="flex">
                    <span className="text-nowrap mr-2">Progress: </span>
                    {dailyProgressPercent}%
                  </div>
                </div>
              </div>
              )}
             
            </div>
          </CardContent>
        </Card>
      </div>

      {isAddWaterModalOpen && (
        <ModalAddWater
          goalReached={goalReached}
          setGoalReached={setGoalReached}
          dailyWaterGoalMl={dailyWaterGoalMl}
          setWaterConsumedMl={setWaterConsumedMl}
          waterConsumedMl={waterConsumedMl}
          waterPresetAmounts={waterPresetAmounts}
        />
      )}
    </div>
  );
}
