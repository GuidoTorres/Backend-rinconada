const { usuario } = require("../../config/db")
const { verifyToken } = require("../helpers/generateToken")



const checkRoleAuth = (roles) => async(req,res,next) => {

    try {

        const token = req.headers.authorization.split(" ").pop()
        const tokenData = await verifyToken(token)
        const userData = await usuario.findByPk(tokenData.id)

        if([].concat(roles).includes(userData.rol_id)){
            next()
        }else{

            res.status(409).send({error: "No autorizado"})
        }
        
    } catch (error) {

        res.status(500).send({error: error})
        
    }
}

module.exports = checkRoleAuth