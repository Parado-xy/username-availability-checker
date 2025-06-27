// Import the Schema object. 
import mongoose, {mongo, Schema} from "mongoose"; 

// Define a user Schema. 
const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: true
        }
    }
); 

const User = mongoose.model("User", UserSchema); 

export default User; 
