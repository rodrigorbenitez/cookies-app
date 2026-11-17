CREATE TYPE "public"."category" AS ENUM('baking', 'dairy', 'produce', 'spices', 'other');--> statement-breakpoint
CREATE TYPE "public"."unit" AS ENUM('g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'piece', 'pinch', 'packet', 'bunch', 'to taste');--> statement-breakpoint
CREATE TABLE "ingredient_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" "category" DEFAULT 'other' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredient_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"catalog_id" integer NOT NULL,
	"amount" double precision,
	"unit" "unit" DEFAULT 'piece' NOT NULL,
	"note" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"image_path" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"rating" integer,
	"servings" integer DEFAULT 4 NOT NULL,
	"prep_time" integer,
	"instructions" text DEFAULT '' NOT NULL,
	"search_vector" "tsvector",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipes_rating_check" CHECK ("recipes"."rating" IS NULL OR "recipes"."rating" BETWEEN 1 AND 5),
	CONSTRAINT "recipes_servings_check" CHECK ("recipes"."servings" > 0)
);
--> statement-breakpoint
CREATE TABLE "shopping_list_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"catalog_id" integer,
	"category" "category" DEFAULT 'other' NOT NULL,
	"amount" double precision,
	"unit" text,
	"checked" boolean DEFAULT false NOT NULL,
	"manual" boolean DEFAULT false NOT NULL,
	"sources" text[] DEFAULT '{}'::text[] NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_list_recipes" (
	"recipe_id" integer PRIMARY KEY NOT NULL,
	"servings" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ingredient_groups" ADD CONSTRAINT "ingredient_groups_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_group_id_ingredient_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."ingredient_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_catalog_id_ingredient_catalog_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."ingredient_catalog"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_catalog_id_ingredient_catalog_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."ingredient_catalog"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_recipes" ADD CONSTRAINT "shopping_list_recipes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ingredient_catalog_name_lower_idx" ON "ingredient_catalog" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "ingredient_groups_recipe_idx" ON "ingredient_groups" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "ingredients_group_idx" ON "ingredients" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "ingredients_catalog_idx" ON "ingredients" USING btree ("catalog_id");--> statement-breakpoint
CREATE INDEX "recipes_tags_idx" ON "recipes" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "recipes_search_idx" ON "recipes" USING gin ("search_vector");