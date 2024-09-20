import { Request, Response } from 'express';
import { Role, RoleDocument, RoleInput } from '../models/role.model';

const createRole = async (req: Request, res: Response) => {
  const { description, name } = req.body;

  if (!name || !description) {
    return res.status(422).json({
      message: 'The fields name and description are mandatory!',
    });
  }

  const role = (await Role.findOne({ name })) as RoleDocument;

  if (role) {
    return res.status(409).json({ message: `Role with name "${name}" already exists!` });
  }

  const roleInput: RoleInput = {
    name,
    description,
  };

  const roleCreated = (await Role.create(roleInput)) as RoleDocument;

  return res.status(201).json({ data: roleCreated });
};

const getAllRoles = async (req: Request, res: Response) => {
  const roles = await Role.find().sort('-createdAt').exec();

  return res.status(200).json({ data: roles });
};

const getRole = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const role = (await Role.findById(id)) as RoleDocument;

    if (!role) {
      return res.status(404).json({ message: `Role with id "${id}" not found!` });
    }

    return res.status(200).json({ data: role });
  } catch (err) {
    console.log(`Error getting role by id: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { description } = req.body;

  if (!description) {
    return res.status(422).json({ message: 'The field description is mandatory!' });
  }

  try {
    let role = (await Role.findByIdAndUpdate(id, { description })) as RoleDocument;

    if (!role) {
      return res.status(404).json({ message: `Role with id "${id}" not found!` });
    }

    role = (await Role.findById(id)) as RoleDocument;
    return res.status(200).json({ data: role });
  } catch (err) {
    console.log(`updateRole Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

const deleteRole = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deletedRole = (await Role.findByIdAndDelete(id)) as RoleDocument;

    if (!deletedRole) {
      return res.status(404).json({ message: `Role with id "${id}" not found!` });
    }

    return res.status(200).json({ message: `Role with id "${id}" deleted!` });
  } catch (err) {
    console.log(`deleteRole Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

export { createRole, getAllRoles, getRole, updateRole, deleteRole };
