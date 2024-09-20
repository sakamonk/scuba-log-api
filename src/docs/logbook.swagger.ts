/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     DiveLog:
 *       type: object
 *       required:
 *         - startTime
 *         - endTime
 *         - maxDepth
 *         - location
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the dive log
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Dive start time
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: Dive end time
 *         maxDepth:
 *           type: number
 *           description: Maximum depth during the dive
 *         avgDepth:
 *           type: number
 *           description: Average depth during the dive
 *         waterTemperature:
 *           type: number
 *           description: Water temperature during the dive
 *         airTemperature:
 *           type: number
 *           description: Air temperature during the dive
 *         tankMaterial:
 *           type: string
 *           description: Material of the tank used during the dive
 *         tankVolume:
 *           type: number
 *           description: Volume of the tank used during the dive
 *         tankStartPressure:
 *           type: number
 *           description: Starting pressure of the tank
 *         tankEndPressure:
 *           type: number
 *           description: Ending pressure of the tank
 *         waterBody:
 *           type: string
 *           description: Name of the water body
 *         location:
 *           type: string
 *           description: Location of the dive
 *         visibility:
 *           type: string
 *           description: Visibility during the dive
 *         additionalInfo:
 *           type: string
 *           description: Additional information about the dive
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The user ID
 *             fullName:
 *               type: string
 *               description: The full name of the user
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the log was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the log was last updated
 *       example:
 *         id: "6123abcde1234567890f1gh2"
 *         startTime: "2024-09-10T10:00:00.000Z"
 *         endTime: "2024-09-10T11:00:00.000Z"
 *         maxDepth: 30
 *         avgDepth: 25
 *         waterTemperature: 22
 *         airTemperature: 28
 *         tankMaterial: "Steel"
 *         tankVolume: 12
 *         tankStartPressure: 200
 *         tankEndPressure: 50
 *         waterBody: "Lake Tahoe"
 *         location: "South Shore"
 *         visibility: "Clear"
 *         additionalInfo: "Great visibility, clear skies."
 *         user:
 *           id: "1234567890abcdef12345678"
 *           fullName: "John Doe"
 *         createdAt: "2024-09-10T12:00:00.000Z"
 *         updatedAt: "2024-09-10T12:30:00.000Z"
 *
 * tags:
 *   - name: DiveLogs
 *     description: API for managing dive logs
 */

/**
 * @swagger
 * /api/v1/logbooks:
 *   post:
 *     summary: Create a new dive log
 *     tags: [DiveLogs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DiveLog'
 *     responses:
 *       201:
 *         description: Dive log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiveLog'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error (missing required fields)
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/v1/logbooks:
 *   get:
 *     summary: Get all dive logs
 *     tags: [DiveLogs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *           description: Maximum number of logs to return
 *       - in: query
 *         name: tsStart
 *         schema:
 *           type: string
 *           format: date-time
 *           description: Filter logs starting from this timestamp
 *       - in: query
 *         name: tsEnd
 *         schema:
 *           type: string
 *           format: date-time
 *           description: Filter logs ending at this timestamp
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           description: Field to sort logs by (default is "createdAt")
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           description: Sort order, either "asc" or "desc" (default is "desc")
 *       - in: query
 *         name: activeUsersOnly
 *         schema:
 *           type: boolean
 *           description: Filter logs by active users only
 *     responses:
 *       200:
 *         description: List of dive logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DiveLog'
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/v1/logbooks/{id}:
 *   get:
 *     summary: Get a dive log by ID
 *     tags: [DiveLogs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the dive log
 *     responses:
 *       200:
 *         description: Dive log retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiveLog'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Dive log not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/v1/logbooks/{id}:
 *   patch:
 *     summary: Update a dive log by ID
 *     tags: [DiveLogs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the dive log
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DiveLog'
 *     responses:
 *       200:
 *         description: Dive log updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiveLog'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Dive log not found
 *       422:
 *         description: Validation error (missing required fields)
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/v1/logbooks/{id}:
 *   delete:
 *     summary: Delete a dive log by ID
 *     tags: [DiveLogs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the dive log
 *     responses:
 *       200:
 *         description: Dive log deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Dive log not found
 *       500:
 *         description: Internal Server Error
 */
