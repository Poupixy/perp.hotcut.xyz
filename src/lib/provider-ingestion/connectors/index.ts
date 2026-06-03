import { CollectorCryptSalesConnector } from "./collector-crypt";
import { MagicEdenSalesConnector } from "./magic-eden";
import { PhygitalsSalesConnector } from "./phygitals";
import { TensorSalesConnector } from "./tensor";

export function createSalesConnectors() {
  return [
    new MagicEdenSalesConnector(),
    new TensorSalesConnector(),
    new PhygitalsSalesConnector(),
    new CollectorCryptSalesConnector(),
  ];
}
