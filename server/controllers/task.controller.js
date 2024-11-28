const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const User = require("../models/User.model");
const Task = require("../models/Task.model");
const Notice = require("../models/notification.model");

const createTask = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.user;
    console.log(_id);
    console.log(req.user);
    const { title, team, stage, date, priority, assets } = req.body;

    let text = "New task has been assigned to you";
    if (team.length > 1) {
      text = text + `and ${team.length - 1} others`;
    }

    text =
      text +
      ` The task priority is set a ${priority} priority, so check and act accordingly. The task date is ${new Date(
        date
      ).toDateString()}. Thank you!!!`;

      const activities = {
        type: "assigned",
        activity: text,
        by: _id,
      };


    const task = await Task.create({
        title,
        team,
        stage: stage.toLowerCase(),
        date,
        activities,
        priority: priority.toLowerCase(),
        assets,
      });

    await Notice.create({
      team,
      text,
      task: task._id,
    });
    return res.json(new ApiResponse(200, task, "Task created successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message, "Something went wrong");
  }
});

const duplicateTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    const newTask = await Task.create({
      ...task,
      title: task.title + " - Duplicate",
    });

    newTask.team = task.team;
    newTask.subTasks = task.subTasks;
    newTask.assets = task.assets;
    newTask.priority = task.priority;
    newTask.stage = task.stage;

    await newTask.save();

    let text = "New task has been assigned to you";
    if (task.team.length > 1) {
      text = text + `and ${task.team.length - 1} others`;
    }

    text =
      text +
      ` The task priority is set a ${priority} priority, so check and act accordingly. The task date is ${new Date(
        date
      ).toDateString()}. Thank you!!!`;

    await Notice.create({
      team: task.team,
      text,
      task: newTask._id,
    });

    return res.json(
      new ApiResponse(200, newTask, "Task duplicated successfully")
    );
  } catch (error) {
    throw new ApiError(500, error?.message, "Something went wrong");
  }
});

const postTaskActivity = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { _id } = req.user;
    const { type, activity } = req.body;

    const task = await Task.findById(id);

    const data = {
      type,
      activity,
      by: _id,
    };
    task.activities.push(data);

    await task.save();
    return res.json(
      new ApiResponse(200, task, "Task activity posted successfully")
    );
  } catch (error) {
    throw new ApiError(500, error?.message, "Something went wrong");
  }
});

const dashboardStatistics = asyncHandler(async (req, res) => {
  try {
    const { _id, isAdmin } = req.user;
    console.log(req.user);
    const allTasks = isAdmin
      ? await Task.find({
          isTrashed: false,
        })
          .populate({
            path: "team",
            select: "name role title email",
          })
          .sort({ _id: -1 })
      : await Task.find({
          isTrashed: false,
          team: { $all: [_id] },
        })
          .populate({
            path: "team",
            select: "name role title email",
          })
          .sort({ _id: -1 });

    const users = await User.find({ isActive: true })
      .select("name title role isAdmin createdAt")
      .limit(10)
      .sort({ _id: -1 });

    //   group task by stage and calculate counts
    const groupTasks = allTasks.reduce((result, task) => {
      const stage = task.stage;

      if (!result[stage]) {
        result[stage] = 1;
      } else {
        result[stage] += 1;
      }

      return result;
    }, {});

    // Group tasks by priority
    const groupData = Object.entries(
      allTasks.reduce((result, task) => {
        const { priority } = task;

        result[priority] = (result[priority] || 0) + 1;
        return result;
      }, {})
    ).map(([name, total]) => ({ name, total }));

    // calculate total tasks
    const totalTasks = allTasks?.length;
    const last10Task = allTasks?.slice(0, 10);

    const summary = {
      totalTasks,
      last10Task,
      users: isAdmin ? users : [],
      tasks: groupTasks,
      graphData: groupData,
    };

    return res.json(new ApiResponse(200, summary, "Successfully Fetched"));
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
});

const getTasks = asyncHandler(async (req, res) => {
  try {
    const { stage, isTrashed } = req.query;
    let query = { isTrashed: isTrashed ? true : false };
    if (stage) {
      query.stage = stage;
    }

    let queryResult = Task.find(query)
      .populate({
        path: "team",
        select: "name title email",
      })
      .sort({ _id: -1 });

    const task = await queryResult;
    return res.json(new ApiResponse(200, task, "Task fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message, "Something went wrong");
  }
});

const getTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const task = await Task.findById(id)
      .populate({
        path: "team",
        select: "name title role email",
      })
      .populate({
        path: "activities.by",
        select: "name",
      });

    return res.json(new ApiResponse(200, task, "Task fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message, "Something went wrong");
  }
});

const createSubTask = asyncHandler(async (req, res) => {
  try {
    const { title, tag, date } = req.body;

    const { id } = req.params;
    console.log(id,'i');
    
    const newSubTask = {
      title,
      date,
      tag,
    };

    const task = await Task.findById(id);
    console.log(task);
    task.subTasks.push(newSubTask);
    await task.save();

    return res.json(new ApiResponse(200, task, "SubTask added successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message, "Something went wrong");
  }
});

const updateTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, team, stage, priority, assets } = req.body;

    const task = await Task.findById(id);

    task.title = title;
    task.date = date;
    task.priority = priority.toLowerCase();
    task.assets = assets;
    task.stage = stage.toLowerCase();
    task.team = team;

    await task.save();

    return res.json(new ApiResponse(200, task, "Task updated successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message, "Something went wrong");
  }
});

const trashTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    task.isTrashed = true;

    await task.save();

    return res.json(new ApiResponse(200, task, "Task trashed successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message, "Something went wrong");
  }
});

const deleteRestoreTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const { actionType } = req.query;
    console.log(actionType);

    if (actionType === "delete") {
      await Task.findByIdAndDelete(id);
      return res.json(new ApiResponse(200, null, "Task deleted successfully"));
    } else if (actionType === "deleteAll") {
      await Task.deleteMany({ isTrashed: true });
      return res.json(new ApiResponse(200, null, "All trashed tasks deleted successfully"));
    } else if (actionType === "restore") {
      const task = await Task.findById(id);
      task.isTrashed = false;
      await task.save();
      return res.json(new ApiResponse(200, task, "Task restored successfully"));
    } else if (actionType === "restoreAll") {
      await Task.updateMany({ isTrashed: true }, { $set: { isTrashed: false } });
      return res.json(new ApiResponse(200, null, "All trashed tasks restored successfully"));
    }
    return res.json(new ApiResponse(200, null, "Operation performed successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message, "Something went wrong");
  }
});

module.exports = {
  createTask,
  duplicateTask,
  postTaskActivity,
  dashboardStatistics,
  getTask,
  trashTask,
  deleteRestoreTask,
  getTasks,
  createSubTask,
  updateTask
};
