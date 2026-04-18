import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { IdParam, DrinkWaterEntryBody } from "../types/index.js";

const DrinkWaterEntrySchema = z.object({
  quantity_ml: z.number().min(1),
  source: z.string().optional(),
  when_drink: z.string().refine((str) => !isNaN(Date.parse(str)), {
    message: "Invalid date string format. Use YYYY-MM-DD",
  }),
});

const DrinkWaterSummarySchema = z.object({
  drinkwater_day: z.string().refine((str) => !isNaN(Date.parse(str)), {
    message: "Invalid date string format. Use YYYY-MM-DD",
  }).optional(),
  total_ml: z.number().min(0),
  goal_ml: z.number().min(0).optional(),
  success: z.boolean().optional(),
});

const LogsQuerySchema = z.object({
  date: z.string().optional(),
  days: z.string().optional(),
});
type LogsQuery = z.infer<typeof LogsQuerySchema>;
type DrinkWaterSummary = {
  user_id: string;
  drinkwater_day: string;
  total_ml: number;
  goal_ml: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export async function drinkWaterRoutes(app: FastifyInstance) {

  //HELPERS

  async function getTodaySummary(user_id: string): Promise<DrinkWaterSummary | null> {
    const today = new Date();
    const { data, error } = await app.supabase
      .from("drinkwater_summary")
      .select()
      .eq("drinkwater_day", today.toISOString().split("T")[0])
      .eq("user_id", user_id)

    if (error) throw app.httpErrors.internalServerError(error.message);
    if (!data || data.length === 0) return null;
    return data[0];
  }



  app.addHook("preHandler", app.authRequired);

  app.get<{ Querystring: LogsQuery }>("/logs", async (req) => {
    const dateParams = req.query.date;


    const targetDate = dateParams || new Date().toISOString().split("T")[0];
    // Criar início do dia (00:00:00)
    const inicio = new Date(targetDate + "T00:00:00Z");

    // Criar fim do dia (início + 1 dia)
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 1);

    console.log("Início:", inicio.toISOString());
    console.log("Fim:", fim.toISOString());


    const { data, error } = await app.supabase
      .from("drinkwater_logs")
      .select("*")
      .eq("user_id", req.user!.id)
      .gte("when_drink", inicio.toISOString())
      .lte("when_drink", fim.toISOString())
      .order("when_drink");
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  app.post<{ Body: DrinkWaterEntryBody }>("/logs", async (req) => {
    const parsed = DrinkWaterEntrySchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);
    const { data, error } = await app.supabase
      .from("drinkwater_logs")
      .insert({ ...parsed.data, user_id: req.user!.id })
      .select()
      .maybeSingle();
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });


  app.get<{ Querystring: LogsQuery }>("/today", async (req) => {
    const daysParams = req.query.days;
    // date days implementation>
    const today = new Date();

    const { data, error } = await app.supabase
      .from("drinkwater_summary")
      .select()
      .eq("drinkwater_day", today.toISOString().split("T")[0])
      .eq("user_id", req.user!.id)
    if (error) throw app.httpErrors.internalServerError(error.message);
    if (!data || data.length === 0) return null;
    return data[0];
  });


  app.put("/today", async (req) => {
    // date days implementation>
    const today = new Date();
    const parsed = DrinkWaterSummarySchema.safeParse(req.body);
    const sumComsumedToday = await getTodaySummary(req.user!.id);
    console.log("Value of today:", sumComsumedToday);
    console.log("parsed data:", parsed);
    let newTotal = 0;
    if (!parsed.success) {
      throw app.httpErrors.badRequest(parsed.error.message);
    } else {
      newTotal = sumComsumedToday ? sumComsumedToday.total_ml + parsed.data.total_ml : parsed.data.total_ml;
    }
    if ( !sumComsumedToday){

    }

    const { data, error } = await app.supabase
      .from("drinkwater_summary")
      .upsert({
        user_id: req.user!.id,       // ✅
        drinkwater_day: today,       // ✅
        total_ml: newTotal,  // ✅
        goal_ml:sumComsumedToday?.goal_ml  // ✅
      })


    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });










  app.post<{ Body: DrinkWaterEntryBody }>("/history", async (req) => {
    const parsed = DrinkWaterSummarySchema.safeParse(req.body);

    const { data, error } = await app.supabase
      .from("drinkwater_summary")
      .insert({ ...parsed.data, user_id: req.user!.id })
      .select()
      .maybeSingle();
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  app.get<{ Querystring: LogsQuery }>("/history", async (req) => {
    const daysParams = req.query.days;
    // date days implementation>

    const DaysAgo = parseInt(daysParams || "0");
    const initialDay = new Date();
    initialDay.setDate(initialDay.getDate() - DaysAgo);

    const { data, error } = await app.supabase
      .from("drinkwater_summary")
      .select("*")
      .eq("user_id", req.user!.id)
      .gte("drinkwater_day", initialDay.toISOString().split("T")[0])
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });



}
