Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: "users/sessions",
    registrations: "users/registrations",
    passwords: "users/passwords"
  }

  # Reveal health status on /up that returns 200 if the app boots without exceptions, 500 otherwise.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Public routes
  resources :questions
  resources :exercises do
    member do
      get "start"
    end
    collection do
      get "practice"
    end
  end
  resources :tag

  # Admin routes
  namespace :admin do
    resources :users
  end

  # Analytics routes
  resources :analytics, only: [:index] do
    collection do
      get :performance_logs
      get :dashboard
      get :weak_points
      get :recommendations
      get :cohort
      get :tag_matrix
      get :item_discrimination
    end
    member do
      get :review
    end
  end

  # API routes
  namespace :api do
    patch "classify_question", to: "classify_questions#update"
    resources :assessment_sessions, only: %i[index show create]
  end

  # Taxonomy Nodes API - allow any character in :id to support UUID-x:slug format
  resources :taxonomy_nodes, path: 'taxonomy', id: /[^\/]+/ do
    member do
      get :descendants
      get :ancestors
      get :questions
    end
    collection do
      get :tree
      get :by_level
    end
  end

  # Content Assignments API
  resources :content_assignments, only: [:create, :update, :destroy]

  # Learning Pathways (Student-facing)
  resources :learning_pathways, only: [:index, :show] do
    member do
      get :progress
      post :start_topic
      post :complete_topic
    end
  end

  # Admin namespace
  namespace :admin do
    resources :users
    resources :taxonomy_nodes, id: /[^\/]+/ do
      member do
        patch :reorder
        patch :move
      end
      collection do
        get :full_tree
        get :assemble
      end
    end
  end

  # Root
  root "home#index"

  # Workspace
  get "workspace", to: "workspace#show"
  patch "workspace", to: "workspace#update"
end
