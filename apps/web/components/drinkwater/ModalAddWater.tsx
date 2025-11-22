import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "../ui/card";
import { CircleMinus, CirclePlus } from "lucide-react";

const ModalAddWater = ({
  quantidadeAguaBebida,
  currentQuantidadeAguaBebida,
  setQuantidadeAguaBebida,
  ArrayQuantidadeDefault_de_agua,
  quantidadenecessaria,
  drinkWaterGoal,
  setDrinkWaterGoal,
}: {
  quantidadeAguaBebida: number;
  currentQuantidadeAguaBebida: number;
  setQuantidadeAguaBebida: React.Dispatch<React.SetStateAction<number>>;
  quantidadenecessaria: number;
  ArrayQuantidadeDefault_de_agua: number[];
  drinkWaterGoal: boolean;
  setDrinkWaterGoal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  if (!currentQuantidadeAguaBebida || currentQuantidadeAguaBebida < 0) {
    currentQuantidadeAguaBebida = 0;
  }
  useEffect(() => {
    console.log("current", currentQuantidadeAguaBebida);
    if (currentQuantidadeAguaBebida <= 0) {
      setQuantidadeAguaBebida(0);
      currentQuantidadeAguaBebida = 0;
      setDrinkWaterGoal(false);
    }
  }, [currentQuantidadeAguaBebida]);

  const handleSetQuantidadeAguaBebida = (quantidadeAguaBebida: number) => {
    console.log("quantidade de agua bebida", quantidadeAguaBebida);
    console.log("currentQuantidadeAguaBebida", currentQuantidadeAguaBebida);
    console.log("quantidadenecessaria", quantidadenecessaria);

    if (currentQuantidadeAguaBebida >= quantidadenecessaria) {
      console.log("voce ja atingiu sua meta diaria de agua!!!!!!!!!!!!!!!!");
      setDrinkWaterGoal(true);
    } else {
      console.log("voce ainda nao atingiu sua meta diaria de agua");
      setQuantidadeAguaBebida(
        currentQuantidadeAguaBebida + quantidadeAguaBebida
      );
    }
  };
  const handleRemoveQuantidadeAguaBebida = (quantidadeAguaBebida: number) => {
    console.log("quantidade de agua removida", quantidadeAguaBebida);
    setQuantidadeAguaBebida(currentQuantidadeAguaBebida - quantidadeAguaBebida);
    if (currentQuantidadeAguaBebida <= 0) {
      setQuantidadeAguaBebida(0);
      currentQuantidadeAguaBebida = 0;
      setDrinkWaterGoal(false);
    }
    console.log("currentQuantidadeAguaBebida", currentQuantidadeAguaBebida);
  };

  return (
    <div>
      <div className="flex gap-4">


      {ArrayQuantidadeDefault_de_agua.map((quantidadeAgua_lista, index) => (
        <div key={index} className="flex justify-center gap-6 mb-2">
          {index === 0 ?  (<span>|</span>) :  null}
    
            <span>
              <CircleMinus
                key={index}
                onClick={() =>
                  handleRemoveQuantidadeAguaBebida(quantidadeAgua_lista)
                }
                className={
                  quantidadeAguaBebida > 0 ? "cursor-pointer text-red-400" : "opacity-50"
                }
              />
            </span>

            <span key={index}>{quantidadeAgua_lista}ml</span>

            <span>
              <CirclePlus
                key={index}
                onClick={() =>
                  handleSetQuantidadeAguaBebida(quantidadeAgua_lista)
                }
                className={drinkWaterGoal ? "opacity-50 "  : "cursor-pointer text-green-400"}
              />{" "}
            </span>
            |
        </div>
      ))}
            </div>

      <Card>
        <CardHeader></CardHeader>
        <input
          type="number"
          placeholder="Quantidade em ml"
          value={currentQuantidadeAguaBebida}
        ></input>

        <Button onClick={() => handleSetQuantidadeAguaBebida}>
          quantidade personalizada de agua
        </Button>
      </Card>
    </div>
  );
};

export default ModalAddWater;
