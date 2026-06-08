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

  # Root
  root "home#index"

  # Workspace
  get "workspace", to: "workspace#show"
  patch "workspace", to: "workspace#update"
end
