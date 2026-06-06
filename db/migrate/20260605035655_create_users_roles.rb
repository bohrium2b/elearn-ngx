class CreateUsersRoles < ActiveRecord::Migration[7.2]
  def change
    create_table :users_roles, id: false do |t|
      t.references :user, null: false, foreign_key: false
      t.references :role, null: false, foreign_key: true
    end

    add_index :users_roles, [:user_id, :role_id], unique: true, name: :index_users_roles_on_user_id_and_role_id
  end
end
