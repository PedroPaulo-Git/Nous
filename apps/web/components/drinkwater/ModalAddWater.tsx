import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "../ui/card";


const ModalAddWater = (
    {quantidadeAguaBebida,
    setQuantidadeAguaBebida,
    ArrayQuantidadeDefault_de_agua
}: {quantidadeAguaBebida: number, setQuantidadeAguaBebida: React.Dispatch<React.SetStateAction<number>>, ArrayQuantidadeDefault_de_agua: number[]}) => {

const handleSetQuantidadeAguaBebida = (quantidadeAguaBebida : number) => {
    console.log("quantidade de agua bebida",quantidadeAguaBebida)
    setQuantidadeAguaBebida(quantidadeAguaBebida + quantidadeAguaBebida);
}
  return (
    <div>
      <Button onClick={() => setQuantidadeAguaBebida(ArrayQuantidadeDefault_de_agua[0] + quantidadeAguaBebida)}>{ArrayQuantidadeDefault_de_agua[0]}ml</Button>
      <Button onClick={() => setQuantidadeAguaBebida(ArrayQuantidadeDefault_de_agua[1] + quantidadeAguaBebida)}>{ArrayQuantidadeDefault_de_agua[1]}ml</Button>
      <Button onClick={() => setQuantidadeAguaBebida(ArrayQuantidadeDefault_de_agua[2] + quantidadeAguaBebida)}>{ArrayQuantidadeDefault_de_agua[2]}ml</Button>
      <Button onClick={() => setQuantidadeAguaBebida(ArrayQuantidadeDefault_de_agua[3] + quantidadeAguaBebida)}>{ArrayQuantidadeDefault_de_agua[3]}ml</Button>
      <Card>
        <CardHeader></CardHeader>
        <input type="number" placeholder="Quantidade em ml" value={quantidadeAguaBebida} ></input> 

        <Button onClick={() => handleSetQuantidadeAguaBebida}>
          quantidade personalizada de agua
        </Button>
      </Card>
    </div>
  );
};

export default ModalAddWater;
