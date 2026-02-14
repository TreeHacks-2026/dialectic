"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { HealthCheck } from "@/components/health-check";
import { TestIndex } from "@/components/test-index";
import { TestSearch } from "@/components/test-search";
import { BulkIngest } from "@/components/bulk-ingest";
import { ProductionSearch } from "@/components/production-search";

export function ApiTester() {
  return (
    <Tabs defaultValue="health" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="health" className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">GET</Badge>
          Health
        </TabsTrigger>
        <TabsTrigger value="test-index" className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">POST</Badge>
          Index
        </TabsTrigger>
        <TabsTrigger value="test-search" className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">GET</Badge>
          Search
        </TabsTrigger>
        <TabsTrigger value="bulk-ingest" className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">POST</Badge>
          Bulk
        </TabsTrigger>
        <TabsTrigger value="search" className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">POST</Badge>
          Search+
        </TabsTrigger>
      </TabsList>
      <TabsContent value="health"><HealthCheck /></TabsContent>
      <TabsContent value="test-index"><TestIndex /></TabsContent>
      <TabsContent value="test-search"><TestSearch /></TabsContent>
      <TabsContent value="bulk-ingest"><BulkIngest /></TabsContent>
      <TabsContent value="search"><ProductionSearch /></TabsContent>
    </Tabs>
  );
}
