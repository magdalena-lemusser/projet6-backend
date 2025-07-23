const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const multer = require('../middleware/multer-config');

const stuffCtrl = require('../controllers/stuff');

router.get('/', stuffCtrl.getAllStuff);
router.post('/', auth, multer, stuffCtrl.createThing);
router.get('/bestrating', stuffCtrl.getBestRatedBooks); // ⬅️ move this up here
router.get('/:id', stuffCtrl.getOneThing);
router.post('/:id/rating', auth, stuffCtrl.rateBook);
router.put('/:id', auth, multer, stuffCtrl.modifyThing);
router.delete('/:id', auth, stuffCtrl.deleteThing);

module.exports = router;
