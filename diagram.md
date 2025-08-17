classDiagram
    class User {
        +String id
        +String name
        +String email
        +List~String~ following
        +List~String~ followers
        +List~String~ visits
        +int total_critic_score
        +List~String~ critic_score_history
        +String user_location
        +List~String~ location_recommendations
        +String cover_photo
        +String user_photo
    }

    class Image {
        +String id
        +String image
    }

    class Visit {
        +String id
        +String user_id
        +String location
        +String time
        +String restaurant_name
        +List~String~ foods
    }

    class Food {
        +String id
        +String description
        +String f_name
        +String user_id
        +String category
        +String nutrition_table
        +String restaurant_id
        +String image_url
    }

    class Review {
        +String id
        +String title
        +String description
        +String food
        +int reaction_count_like
        +int reaction_count_dislike
        +List~String~ reaction_users_like
        +List~String~ reaction_users_dislike
        +List~String~ comments
    }

    class Comment {
        +String user_id
        +String description
    }

    class Recommendation {
        +String id
        +String user_id
        +String user_input
        +String ai_response
    }

    class Restaurant {
        +String id
        +String r_name
        +List~String~ foods
        +List~String~ reviews
    }

    %% Relationships
    User "1" --> "many" Visit
    User "1" --> "many" Food
    User "1" --> "many" Review
    User "1" --> "many" Recommendation
    User "1" --> "many" Comment

    Visit "1" --> "many" Food
    Restaurant "1" --> "many" Food
    Restaurant "1" --> "many" Review
    Food "1" --> "many" Review
    Review "1" --> "many" Comment
    User "1" --> "1" Image