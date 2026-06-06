class CreateRoles < ActiveRecord::Migration[7.2]
  def change
    create_table :roles do |t|
      t.string :name
      t.references :resource, polymorphic: true, null: true

      t.timestamps
    end

    add_index :roles, :name
    add_index :roles, [:name, :resource_type, :resource_id], name: :index_roles_on_name_and_resource
  end
end
