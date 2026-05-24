from uuid import UUID

from flask import request
from pydantic import TypeAdapter

from flask_restx import Namespace

from libs.login import current_account_with_tenant, with_current_user
from models.account import Account
from models.model import App
from services.apps.app_service import AppService
from services.apps.saved_message_service import SavedMessageService
from services.errors.message import MessageNotExistsError
from services.installed_app_service import InstalledAppService

from .error import NotCompletionAppError, NotFound

console_ns = Namespace("console_app", description="Console App API")

from . import console_app_ns


@console_ns.route("/installed-apps/<uuid:installed_app_id>/saved-messages", endpoint="installed_app_saved_messages")
class SavedMessageListApi(InstalledAppResource):
    @console_ns.expect(console_ns.models["SavedMessageListQuery.__name__"])
    @login_required
    @with_current_user
    def get(self, installed_app, current_user: Account):
        app_model = installed_app.app
        if app_model.mode != "completion":
            raise NotCompletionAppError()

        args = request.args.to_dict()
        last_id = args.get("last_id")
        limit = int(args.get("limit", 20))

        pagination = SavedMessageService.pagination_by_last_id(
            app_model,
            current_user,
            str(last_id) if last_id else None,
            limit,
        )
        adapter = TypeAdapter("SavedMessageItem")
        items = [adapter.validate_python(message, from_attributes=True) for message in pagination.data]
        return {
            "limit": pagination.limit,
            "has_more": pagination.has_more,
            "data": items,
        }

    @console_ns.expect(console_ns.models["SavedMessageCreatePayload.__name__"])
    @console_ns.response(200, "Success", console_ns.models["ResultResponse.__name__"])
    @login_required
    @with_current_user
    def post(self, installed_app, current_user: Account):
        app_model = installed_app.app
        if app_model.mode != "completion":
            raise NotCompletionAppError()

        payload = request.get_json()
        message_id = payload.get("message_id")

        try:
            SavedMessageService.save(app_model, current_user, str(message_id))
        except MessageNotExistsError:
            raise NotFound("Message Not Exists.")

        return {"result": "success"}


@console_ns.route(
    "/installed-apps/<uuid:installed_app_id>/saved-messages/<uuid:message_id>",
    endpoint="installed_app_saved_message",
)
class SavedMessageApi(InstalledAppResource):
    @console_ns.response(204, "Saved message deleted successfully")
    @login_required
    @with_current_user
    def delete(self, installed_app, message_id: UUID, current_user: Account):
        app_model = installed_app.app
        message_id_str = str(message_id)

        if app_model.mode != "completion":
            raise NotCompletionAppError()

        SavedMessageService.delete(app_model, current_user, message_id_str)

        return "", 204
