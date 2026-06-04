# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_06_02_015123) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pgcrypto"
  enable_extension "plpgsql"

  create_table "exercises", force: :cascade do |t|
    t.string "title"
    t.jsonb "spec"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "questions", force: :cascade do |t|
    t.string "question_id_code"
    t.jsonb "config_data"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "uuid", default: -> { "gen_random_uuid()" }, null: false
    t.string "slug"
    t.index ["slug"], name: "index_questions_on_slug", unique: true
    t.index ["uuid"], name: "index_questions_on_uuid", unique: true
  end

  create_table "questions_tags", id: false, force: :cascade do |t|
    t.bigint "question_id", null: false
    t.bigint "tag_id", null: false
    t.index ["question_id", "tag_id"], name: "index_questions_tags_on_question_id_and_tag_id", unique: true
    t.index ["tag_id", "question_id"], name: "index_questions_tags_on_tag_id_and_question_id"
  end

  create_table "tags", force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.uuid "uuid", default: -> { "gen_random_uuid()" }, null: false
    t.integer "parent_id"
    t.string "color", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["parent_id"], name: "index_tags_on_parent_id"
    t.index ["uuid"], name: "index_tags_on_uuid", unique: true
  end

  add_foreign_key "tags", "tags", column: "parent_id"
end
