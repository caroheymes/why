class CreateContacts < ActiveRecord::Migration[5.1]
  def change
    create_table :contacts do |t|
      t.string :region
      t.float :lat
      t.float :lng
      t.string :company
      t.string :adr
      t.string :zip
      t.string :city
      t.float :couette
      t.float :manteau
      t.float :chemise
      t.string :facebook
      t.string :website
      t.text :openinghours
      t.text :clients
      t.string :phone
      t.string :phone2
      t.text :prestations
      t.string :reqgeocode
      t.string :chmap

      t.timestamps
    end
  end
end
