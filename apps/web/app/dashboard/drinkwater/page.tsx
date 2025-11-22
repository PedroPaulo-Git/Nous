"use client";
import React, { useState } from "react";
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

export default function DrinkWaterPage() {
  
  const [quantidadeAguaBebida, setQuantidadeAguaBebida] = useState<number>(0); // ml
  let currentQuantidadeAguaBebida = quantidadeAguaBebida;

 
  const [quantidadenecessaria, setQuantidadeNecessaria] =
    useState<number>(3000); // ml

  let daily_progress_bar_percentage = (currentQuantidadeAguaBebida / quantidadenecessaria) * 100;

  if(daily_progress_bar_percentage > 100){
    daily_progress_bar_percentage = 100;
  }

  const [abrirmodaldeadicionaragua, setAbrirModalDeAdicionarAgua] =
    useState(false);
  const ArrayQuantidadeDefault_de_agua = [100, 200, 500, 1000];
  const [drinkWaterGoal, setDrinkWaterGoal] = useState(false);

  const t = useTranslations("dashboard");
  const handleQuantidadenecessariaChange = () => {
    setQuantidadeNecessaria(quantidadenecessaria);
    console.log(quantidadenecessaria);
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
              History
            </Button>
          </div>
        </div>
        <Card>
          <Button
            onClick={() =>
              setAbrirModalDeAdicionarAgua(!abrirmodaldeadicionaragua)
            }
            className="mb-4 mt-4 ml-4"
            variant="ghost"
          >
            <Plus className="w-4 h-4 mr-2" />
            Beber agua
          </Button>
          <div>
            <input
              type="number"
              value={quantidadenecessaria}
              onChange={(e) => setQuantidadeNecessaria(Number(e.target.value))}
            />

            <Button onClick={handleQuantidadenecessariaChange}>
              setQuantidadeNecessaria
            </Button>
          </div>

          <CardHeader></CardHeader>
          <CardContent>
            <div>
              <div
                className={` bg-gray-100 w-10 flex items-end `}
                style={{ height: `${quantidadenecessaria / 10}px` }}
              >
                <div
                  className={` bg-blue-600 w-10`}
                  style={{ height: `${daily_progress_bar_percentage}%` }}
                ></div>

                <div className="ml-14">
                <div className="flex">
                  <span className="text-nowrap mr-2">Quantity Needed: </span>
                 {quantidadenecessaria}ml
                </div>
                 <div className="flex">
                  <span className="text-nowrap mr-2">Current drinked water: </span>
                 {currentQuantidadeAguaBebida}ml
                </div>
                <div className="flex">
                  <span className="text-nowrap mr-2">Daily Percentage:   </span>
                    {daily_progress_bar_percentage}%
                </div>
                </div>
                 
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {abrirmodaldeadicionaragua && (
        <ModalAddWater
          setDrinkWaterGoal={setDrinkWaterGoal}
          drinkWaterGoal={drinkWaterGoal}
          quantidadenecessaria={quantidadenecessaria}
          setQuantidadeAguaBebida={setQuantidadeAguaBebida}
          quantidadeAguaBebida={quantidadeAguaBebida}
          currentQuantidadeAguaBebida={currentQuantidadeAguaBebida}
          ArrayQuantidadeDefault_de_agua={ArrayQuantidadeDefault_de_agua}
        />
      )}
    </div>
  );
}
