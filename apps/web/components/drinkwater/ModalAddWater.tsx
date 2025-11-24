import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "../ui/card";
import { CircleMinus, CirclePlus } from "lucide-react";

interface ModalAddWaterProps {
  waterConsumedMl: number;
  setWaterConsumedMl: React.Dispatch<React.SetStateAction<number>>;
  dailyWaterGoalMl: number;
  waterPresetAmounts: number[];
  goalReached: boolean;
  setGoalReached: React.Dispatch<React.SetStateAction<boolean>>;
}

const ModalAddWater: React.FC<ModalAddWaterProps> = ({
  waterConsumedMl,
  setWaterConsumedMl,
  dailyWaterGoalMl,
  waterPresetAmounts,
  goalReached,
  setGoalReached,
}) => {
  const currentWater = waterConsumedMl < 0 ? 0 : waterConsumedMl;
  const [customAmountMl, setCustomAmountMl] = useState<number>(0);

  useEffect(() => {
    if (currentWater <= 0) {
      setGoalReached(false);
    }
  }, [currentWater, setGoalReached]);

  const addWater = (amount: number) => {
    if (goalReached) return;
    const newTotal = currentWater + amount;
    setWaterConsumedMl(newTotal);
    if (newTotal >= dailyWaterGoalMl) {
      setGoalReached(true);
    }
  };

  const removeWater = (amount: number) => {
    const newTotal = currentWater - amount;
    const sanitized = newTotal < 0 ? 0 : newTotal;
    setWaterConsumedMl(sanitized);
    if (sanitized < dailyWaterGoalMl) {
      setGoalReached(false);
    }
  };

  const addCustomAmount = () => {
    if (customAmountMl > 0) {
      addWater(customAmountMl);
      setCustomAmountMl(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {waterPresetAmounts.map((preset, idx) => (
          <div key={idx} className="flex items-center gap-4 mb-2">
            <CircleMinus
              onClick={() => removeWater(preset)}
              className={
                currentWater > 0 ? "cursor-pointer text-red-500" : "opacity-40"
              }
            />
            <span>{preset}ml</span>
            <CirclePlus
              onClick={() => addWater(preset)}
              className={
                goalReached ? "opacity-40" : "cursor-pointer text-green-500"
              }
            />
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="p-4">
          <div className="text-sm font-medium">Custom Amount</div>
        </CardHeader>
        <div className="p-4 space-y-3">
          <input
            type="number"
            min={0}
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Amount (ml)"
            value={customAmountMl}
            onChange={(e) => setCustomAmountMl(Number(e.target.value))}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={addCustomAmount}
            disabled={goalReached || customAmountMl <= 0}
          >
            Add Custom Amount
          </Button>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Consumed Today: {currentWater}ml / Goal: {dailyWaterGoalMl}ml</p>
            {goalReached && (
              <p className="text-green-600 font-semibold">Daily goal reached!</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ModalAddWater;
