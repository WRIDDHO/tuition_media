const {
  createResource, getAllResources, getResourceById,
  getResourcesByTeacher, incrementDownloadCount, deleteResource,
} = require('../models/resource.model');
const { buildResourceUrl } = require('../middleware/upload.middleware');

async function create(req, res) {
  try {
    const { subjectId, classLevel, title, description } = req.body;

    if (!subjectId || !title || !req.file) {
      return res.status(400).json({ error: 'subjectId, title, and a file are required.' });
    }

    const fileUrl = buildResourceUrl(req.file.filename);
    const fileType = req.file.mimetype;

    const resource = await createResource(req.teacherId, {
      subjectId, classLevel, title, description, fileUrl, fileType,
    });

    res.status(201).json({ message: 'Resource uploaded', resource });
  } catch (err) {
    console.error('CreateResource error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function listAll(req, res) {
  try {
    const { subjectId } = req.query;
    const resources = await getAllResources(subjectId);
    res.status(200).json({ count: resources.length, resources });
  } catch (err) {
    console.error('ListResources error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getOne(req, res) {
  try {
    const resource = await getResourceById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }
    res.status(200).json({ resource });
  } catch (err) {
    console.error('GetResource error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function listMine(req, res) {
  try {
    const resources = await getResourcesByTeacher(req.teacherId);
    res.status(200).json({ resources });
  } catch (err) {
    console.error('ListMine error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function download(req, res) {
  try {
    const updated = await incrementDownloadCount(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Resource not found.' });
    }
    // redirect the browser straight to the actual file
    res.redirect(updated.file_url);
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function remove(req, res) {
  try {
    const deleted = await deleteResource(req.params.id, req.teacherId);
    if (!deleted) {
      return res.status(404).json({ error: 'Resource not found or you do not own it.' });
    }
    res.status(200).json({ message: 'Resource deleted' });
  } catch (err) {
    console.error('DeleteResource error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { create, listAll, getOne, listMine, download, remove };