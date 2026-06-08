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

ActiveRecord::Schema[7.2].define(version: 2026_06_08_050609) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pgcrypto"
  enable_extension "plpgsql"

  create_table "assessment_sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "exercise_id", null: false
    t.decimal "score_percentage", precision: 5, scale: 2
    t.integer "duration_seconds"
    t.datetime "completed_at", null: false
    t.jsonb "telemetry_data", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "uuid", default: -> { "gen_random_uuid()" }, null: false
    t.index ["completed_at"], name: "index_assessment_sessions_on_completed_at"
    t.index ["exercise_id"], name: "index_assessment_sessions_on_exercise_id"
    t.index ["telemetry_data"], name: "index_assessment_sessions_on_telemetry_data", using: :gin
    t.index ["user_id", "exercise_id"], name: "index_assessment_sessions_on_user_id_and_exercise_id"
    t.index ["user_id"], name: "index_assessment_sessions_on_user_id"
    t.index ["uuid"], name: "index_assessment_sessions_on_uuid", unique: true
  end

  create_table "content_assignments", force: :cascade do |t|
    t.bigint "taxonomy_node_id", null: false
    t.bigint "question_id", null: false
    t.integer "position", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["question_id"], name: "index_content_assignments_on_question_id"
    t.index ["taxonomy_node_id", "position"], name: "index_content_assignments_on_taxonomy_node_id_and_position"
    t.index ["taxonomy_node_id", "question_id"], name: "index_content_assignments_on_node_and_question", unique: true
    t.index ["taxonomy_node_id"], name: "index_content_assignments_on_taxonomy_node_id"
  end

  create_table "exercises", force: :cascade do |t|
    t.string "title"
    t.jsonb "spec"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "uuid", default: -> { "gen_random_uuid()" }, null: false
    t.string "slug"
    t.boolean "is_practice", default: false, null: false
    t.index ["is_practice"], name: "index_exercises_on_is_practice"
    t.index ["slug"], name: "index_exercises_on_slug", unique: true
    t.index ["uuid"], name: "index_exercises_on_uuid", unique: true
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

  create_table "roles", force: :cascade do |t|
    t.string "name"
    t.string "resource_type"
    t.bigint "resource_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name", "resource_type", "resource_id"], name: "index_roles_on_name_and_resource"
    t.index ["name"], name: "index_roles_on_name"
    t.index ["resource_type", "resource_id"], name: "index_roles_on_resource"
  end

  create_table "tags", force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.uuid "uuid", default: -> { "gen_random_uuid()" }, null: false
    t.integer "parent_id"
    t.string "color", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "taxonomy_node_id"
    t.index ["parent_id"], name: "index_tags_on_parent_id"
    t.index ["taxonomy_node_id"], name: "index_tags_on_taxonomy_node_id"
    t.index ["uuid"], name: "index_tags_on_uuid", unique: true
  end

  create_table "taxonomy_nodes", force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.uuid "uuid", default: -> { "gen_random_uuid()" }, null: false
    t.integer "level", default: 0, null: false
    t.bigint "parent_id"
    t.bigint "course_id"
    t.integer "position", default: 0
    t.jsonb "metadata", default: {}
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id", "level", "position"], name: "index_taxonomy_nodes_on_course_id_and_level_and_position"
    t.index ["course_id"], name: "index_taxonomy_nodes_on_course_id"
    t.index ["level"], name: "index_taxonomy_nodes_on_level"
    t.index ["parent_id", "position"], name: "index_taxonomy_nodes_on_parent_id_and_position"
    t.index ["parent_id"], name: "index_taxonomy_nodes_on_parent_id"
    t.index ["slug"], name: "index_taxonomy_nodes_on_slug", unique: true
    t.index ["uuid"], name: "index_taxonomy_nodes_on_uuid", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "username"
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  create_table "users_roles", id: false, force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "role_id", null: false
    t.index ["role_id"], name: "index_users_roles_on_role_id"
    t.index ["user_id", "role_id"], name: "index_users_roles_on_user_id_and_role_id", unique: true
    t.index ["user_id"], name: "index_users_roles_on_user_id"
  end

  add_foreign_key "assessment_sessions", "exercises"
  add_foreign_key "assessment_sessions", "users"
  add_foreign_key "content_assignments", "questions"
  add_foreign_key "content_assignments", "taxonomy_nodes"
  add_foreign_key "tags", "tags", column: "parent_id"
  add_foreign_key "tags", "taxonomy_nodes"
  add_foreign_key "taxonomy_nodes", "taxonomy_nodes", column: "course_id"
  add_foreign_key "taxonomy_nodes", "taxonomy_nodes", column: "parent_id"
  add_foreign_key "users_roles", "roles"
end
