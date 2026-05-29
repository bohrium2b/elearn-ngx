class ApplicationController < ActionController::Base
  # Enable CSRF protection – the token is exposed in the layout via
  # <meta name="csrf-token" content="<%= form_authenticity_token %>">
  # so client-side fetch modules can read it with:
  #   document.querySelector('meta[name="csrf-token"]')?.content
  protect_from_forgery with: :exception
end
