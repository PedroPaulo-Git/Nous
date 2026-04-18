import { Suspense } from "react";

async function InstrumentsData() {
  return <pre>{JSON.stringify([], null, 2)}</pre>;
}

export default function Instruments() {
  return (
    <Suspense fallback={<div>Loading instruments...</div>}>
      <InstrumentsData />
    </Suspense>
  );
}
