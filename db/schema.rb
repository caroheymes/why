# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20171216084326) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "contacts", force: :cascade do |t|
    t.string "region"
    t.float "lat"
    t.float "lng"
    t.string "company"
    t.string "adr"
    t.string "zip"
    t.string "city"
    t.float "couette"
    t.float "manteau"
    t.float "chemise"
    t.string "facebook"
    t.string "website"
    t.text "openinghours"
    t.text "clients"
    t.string "phone"
    t.string "phone2"
    t.text "prestations"
    t.string "reqgeocode"
    t.string "chmap"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

end
