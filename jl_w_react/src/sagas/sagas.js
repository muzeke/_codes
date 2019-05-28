import * as types from "../constants/actionTypes";

import { takeLatest, put, all, call } from "redux-saga/effects";
import * as fetchApi from "../services/api";

function* fetchUser() {
  try {
    const data = yield call(fetchApi._fetch, {
      url: "/_api/web/currentUser"
    });
    yield put({ type: types.RECEIVE_USER, payload: data.data });
  } catch (e) {
    yield put({ type: types.FETCH_FAILED, payload: e.message });
  }
}

function* fetchJobFamilyGroup() {
  try {
    const { data } = yield call(fetchApi._fetch, {
      url:
        "/_api/web/lists/getbytitle('Job_Family_Group')/Items?$select=Job_Family_Group, Id"
    });

    console.log(data.value);

    yield put({ type: types.RECEIVE_JOB_FAMILY_GROUP, payload: data.value });
  } catch (e) {
    yield put({ type: types.FETCH_FAILED, payload: e.message });
  }
}

function* fetchJobFamilyGroupDescription({ jobfamilygroup }) {
  try {
    yield put({
      type: "OPEN_SELECT_JFG"
    });

    yield put({
      type: "CHANGE_SELECTED_JFG",
      payload: jobfamilygroup
    });
    const { data } = yield call(fetchApi._fetch, {
      url: `/_api/web/lists/getbytitle('Job_Family_Group')/Items?$filter=Job_Family_Group eq '${encodeURIComponent(
        jobfamilygroup
      )}'`
    });

    yield put({
      type: types.RECEIVE_JOB_FAMILY_GROUP_DESCRIPTION,
      payload: data.value[0].Job_Family_Group_Description
    });

    const jobFamilyData = yield call(fetchApi._fetch, {
      url: `/_api/web/lists/getbytitle('Job_Family')/Items?$select=*,Job_Family_Group/Job_Family_Group&$expand=Job_Family_Group&$filter=Job_Family_Group/Job_Family_Group eq '${encodeURIComponent(
        jobfamilygroup
      )}'`
    });

    yield put({
      type: types.RECEIVE_JOB_FAMILY,
      payload: jobFamilyData.data.value
    });
  } catch (e) {
    yield put({ type: types.FETCH_FAILED, payload: e.message });
  }
}

function* fetchJobFamilyDescription({ jobfamily }) {
  try {
    console.log(jobfamily);

    yield put({
      type: "OPEN_SELECT_JF"
    });

    yield put({
      type: "CHANGE_SELECTED_JF",
      payload: jobfamily
    });
    const { data } = yield call(fetchApi._fetch, {
      url: `/_api/web/lists/getbytitle('Job_Family')/Items?$filter=Job_Family eq '${encodeURIComponent(
        jobfamily
      )}'`
    });

    yield put({
      type: types.RECEIVE_JOB_FAMILY_DESCRIPTION,
      payload: data.value[0].Job_Family_Description
    });
  } catch (e) {
    yield put({ type: types.FETCH_FAILED, payload: e.message });
  }
}

export default function* rootSaga() {
  yield all([
    takeLatest("FETCH_USER", fetchUser),
    takeLatest("FETCH_JOB_FAMILY_GROUP", fetchJobFamilyGroup),
    takeLatest(
      "FETCH_JOB_FAMILY_GROUP_DESCRIPTION",
      fetchJobFamilyGroupDescription
    ),
    takeLatest("FETCH_JOB_FAMILY_DESCRIPTION", fetchJobFamilyDescription)
  ]);
}
