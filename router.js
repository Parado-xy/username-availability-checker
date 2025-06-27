import { Router } from "express";
import filter from "./bloom.js";
import User from "./User.js";

const router = Router();  


router.post(`/api/availability`, async (req, res) => {
    try{
        // Extract the username from request body; 
        const { username } = req.body;

        // CHeck if a username is in filter;
        let inFilter = filter.has(username.trim().toLowerCase()); 

        // if This is "true"
        if(inFilter){
            // Possibly in the set. 
            let user = await User.findOne({username}); 
            // if the user is not null; 
            if(user){
                // User EXISTS in database - username is TAKEN
                res.status(200).json({
                    "success": true,
                    available: false,
                    "reason": "Username exists in database"
                })
            }else{
                // False positive from Bloom filter - but we should be conservative
                // and say it's unavailable to avoid conflicts
                res.status(200).json({
                    "success": true,
                    available: true,  
                    "reason": "Flagged By Filter but unavailable in database"
                })
            }
        }else{
            // Definitely not in the set. 
            res.status(200).json(
                {
                    "success": true,
                    available: true
                }
            )
        }



    }catch(error){
        res.status(500).json({
            "success": false,
            "message": error.message
        })
    }
}); 

export default router; 