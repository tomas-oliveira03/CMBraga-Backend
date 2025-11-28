/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return JWT token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@cmbraga.pt"
 *               password:
 *                 type: string
 *                 example: "Person23!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     profilePictureURL:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, instructor, parent, health_professional]
 *                 websocketURL:
 *                   type: string
 *                   description: WebSocket URL for real-time updates
 *                   example: "ws://localhost:3001/ws?token=your_jwt_token"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */



/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout user and blacklist JWT token until expiration.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *       401:
 *         description: Authentication required or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access token required"
 */


/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: User ID (email)
 *                   example: "user@cmbraga.pt"
 *                 name:
 *                   type: string
 *                   description: User's full name
 *                   example: "João Silva"
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: User's email address
 *                   example: "user@cmbraga.pt"
 *                 profilePictureURL:
 *                   type: string
 *                   description: URL to user's profile picture
 *                   example: "https://example.com/profile-pics/default1.jpg"
 *                 role:
 *                   type: string
 *                   enum: [admin, instructor, parent, health_professional]
 *                   description: User's role in the system
 *                   example: "admin"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Authentication required"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error message"
 */



/**
 * @swagger
 * /auth/register/admin:
 *   post:
 *     summary: Register a new admin
 *     description: Creates a new admin user account
 *     tags:
 *       - Authentication - Register
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao.silva@cmbraga.pt"
 *               phone:
 *                 type: string
 *                 example: "912345678"
 *           example:
 *             name: "Maria Santos"
 *             email: "maria.santos@cmbraga.pt"
 *             phone: "963852741"
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin created successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email already exists"
 *       500:
 *         description: Internal server error
 */



/**
 * @swagger
 * /auth/register/instructor:
 *   post:
 *     summary: Register a new instructor
 *     description: Creates a new instructor user account
 *     tags:
 *       - Authentication - Register
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Carlos Pereira"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "carlos.pereira@cmbraga.pt"
 *               phone:
 *                 type: string
 *                 example: "+351 912 345 678"
 *           example:
 *             name: "Ana Costa"
 *             email: "ana.costa@cmbraga.pt"
 *             phone: "+351 923 456 789"
 *     responses:
 *       201:
 *         description: Instructor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Instructor created successfully"
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /auth/register/health-professional:
 *   post:
 *     summary: Register a new health professional
 *     description: Creates a new health professional user account
 *     tags:
 *       - Authentication - Register
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - specialty
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Dr. Pedro Oliveira"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "pedro.oliveira@cmbraga.pt"
 *               phone:
 *                 type: string
 *                 example: "987654321"
 *               specialty:
 *                 type: string
 *                 enum: [pediatrician, nutritionist, general_practitioner]
 *                 example: "pediatrician"
 *           example:
 *             name: "Dra. Sofia Mendes"
 *             email: "sofia.mendes@cmbraga.pt"
 *             phone: "951753468"
 *             specialty: "nutritionist"
 *     responses:
 *       201:
 *         description: Health Professional created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Health Professional created successfully"
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
*/



/**
 * @swagger
 * /auth/register/parent:
 *   post:
 *     summary: Register a new parent
 *     description: Creates a new parent user account
 *     tags:
 *       - Authentication - Register
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Ricardo Mendes"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ricardo.mendes@gmail.com"
 *               phone:
 *                 type: string
 *                 example: "+351 934 567 890"
 *               address:
 *                 type: string
 *                 example: "Rua das Flores, 123 - Braga"
 *           example:
 *             name: "Isabel Costa"
 *             email: "isabel.costa@gmail.com"
 *             phone: "+351 945 678 901"
 *             address: "Avenida da Liberdade, 456 - Braga"
 *     responses:
 *       201:
 *         description: Parent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parent created successfully"
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
*/


/**
 * @swagger
 * /auth/register/child:
 *   post:
 *     summary: Register a new child
 *     description: Creates a new child and associates them with parent(s) and a school station
 *     tags:
 *       - Authentication - Register
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - gender
 *               - school
 *               - schoolGrade
 *               - dateOfBirth
 *               - heightCentimeters
 *               - weightKilograms
 *               - parentIds
 *               - dropOffStationId
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Carlos Pereira"
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *                 example: "male"
 *               school:
 *                 type: string
 *                 example: "Escola Básica de Braga"
 *               schoolGrade:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 5
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "2015-08-25"
 *               heightCentimeters:
 *                 type: number
 *                 minimum: 0
 *                 nullable: true
 *                 example: 120
 *                 description: "Child's height in centimeters"
 *               weightKilograms:
 *                 type: number
 *                 minimum: 0
 *                 nullable: true
 *                 example: 25
 *                 description: "Child's weight in kilograms"
 *               parentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["parent-uuid-1", "parent-uuid-2"]
 *               dropOffStationId:
 *                 type: string
 *                 example: "station-uuid-1"
 *                 description: "School station ID where the child will be dropped off"
 *           example:
 *             name: "Ana Costa"
 *             gender: "female"
 *             school: "Escola Básica de Braga"
 *             schoolGrade: 2
 *             dateOfBirth: "2016-02-14"
 *             heightCentimeters: 110
 *             weightKilograms: 22
 *             parentIds: ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
 *             dropOffStationId: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *     responses:
 *       201:
 *         description: Child created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child created successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: At least one parent doesn't exist or station does not exist/isn't a school
 *       500:
 *         description: Internal server error
 */

