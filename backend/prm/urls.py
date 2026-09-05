from django.urls import path
from . import views

urlpatterns = [
    path("health", views.health),

    path("auth/login", views.login_view),
    path("auth/register", views.register_view),
    path("auth/logout", views.logout_view),
    path("auth/google", views.google_auth_view),
    path("profile", views.profile),

    path("partners/", views.list_partners),
    path("partners/solicitudes/list", views.list_solicitudes),
    path("partners/<str:partner_id>", views.partner_detail),

    path("admin/partner-types", views.list_partner_types),
    path("admin/partner-types/<str:key>", views.partner_type_detail),

    path("courses/", views.courses_list_or_create),
    path("courses/progress", views.update_progress),
    path("courses/progress/<str:partner_id>", views.get_partner_progress),
    path("courses/watch-time", views.track_watch_time),
    path("courses/quiz-bank", views.quiz_bank),
    path("courses/quiz-bank/<str:question_id>", views.quiz_bank_detail),
    path("materials/upload", views.upload_material),
    path("thumbnails/upload", views.upload_thumbnail),
    path("courses/<str:course_id>/video-progress", views.get_course_video_progress),
    path("courses/<str:course_id>", views.course_detail),
    path("courses/<str:course_id>/duplicate", views.duplicate_course),
    path("courses/<str:course_id>/exam", views.course_exam),
    path("courses/<str:course_id>/exam/submit", views.course_exam_submit),
    path("courses/<str:course_id>/exam-questions", views.exam_question_list),
    path("courses/<str:course_id>/exam-questions/create", views.exam_question_create),
    path("courses/<str:course_id>/exam-questions/reorder", views.exam_question_reorder),
    path("courses/<str:course_id>/exam-questions/generate", views.exam_generate_from_bank),
    path("courses/<str:course_id>/exam-questions/<str:question_id>", views.exam_question_update),
    path("courses/<str:course_id>/exam-questions/<str:question_id>/delete", views.exam_question_delete),
    path("courses/<str:course_id>/rating", views.course_rating),
    path("courses/<str:course_id>/assignments", views.course_assignments),
    path("courses/<str:course_id>/assignments/<str:assignment_id>", views.course_assignment_delete),
    path("courses/<str:course_id>/videos", views.upload_video),
    path("courses/<str:course_id>/materials/upload", views.upload_material),
    path("courses/<str:course_id>/videos/reorder", views.reorder_videos),
    path("courses/<str:course_id>/videos/<str:video_id>", views.delete_video),
    path("courses/<str:course_id>/videos/<str:video_id>/quiz", views.quiz_questions),
    path("courses/<str:course_id>/videos/<str:video_id>/quiz/submit", views.submit_quiz),
    path("courses/<str:course_id>/videos/<str:video_id>/quiz/results", views.quiz_results),
    path("courses/<str:course_id>/videos/<str:video_id>/quiz/generate", views.generate_video_quiz),
    path("courses/<str:course_id>/videos/<str:video_id>/quiz/bank/<str:question_id>", views.add_bank_question_to_video),
    path("courses/<str:course_id>/videos/<str:video_id>/quiz/<str:question_id>", views.quiz_question_detail),

    path("courses/<str:course_id>/videos/<str:video_id>/checkpoints", views.video_checkpoints),
    path("courses/<str:course_id>/videos/<str:video_id>/checkpoints/reorder", views.reorder_checkpoints),
    path("courses/<str:course_id>/videos/<str:video_id>/checkpoints/submit/<str:checkpoint_id>", views.submit_checkpoint),
    path("courses/<str:course_id>/videos/<str:video_id>/checkpoints/<str:checkpoint_id>", views.video_checkpoint_detail),

    path("products/", views.products_list_or_create),
    path("products/<str:product_key>", views.product_detail),

    path("chat", views.chat_message),

    path("notifications/", views.notifications_list),
    path("notifications/unread", views.notifications_unread_count),
    path("notifications/read-all", views.notifications_mark_all_read),
    path("notifications/broadcast", views.notifications_broadcast),
    path("notifications/<str:notification_id>/read", views.notification_mark_read),

    path("deals/", views.deals_list_or_create),
    path("deals/all", views.list_all_deals),
    path("deals/<str:deal_id>", views.deal_detail),

    path("reports/admin/stats", views.admin_stats),
    path("reports/partner/stats", views.partner_stats),

    path("commissions/", views.my_commissions),

    path("pipeline/", views.pipeline_list_or_create),
    path("pipeline/stats", views.pipeline_stats),
    path("pipeline/automation", views.pipeline_automation),
    path("pipeline/<str:opp_id>", views.opportunity_detail),
    path("pipeline/<str:opp_id>/events", views.opportunity_events),

    path("lms/overview", views.lms_overview),
    path("lms/report", views.lms_report),
    path("lms/export", views.lms_export_excel),
    path("lms/analytics", views.lms_analytics),
    path("lms/check-deadlines", views.check_deadline_reminders),
    path("lms/certificate/<str:course_id>", views.certificate_download),
    path("lms/onboarding", views.onboarding_view),
    path("lms/onboarding/step", views.onboarding_step),

    path("partner-users/", views.partner_users_list_or_create),
    path("partner-users/register", views.partner_user_register),
    path("partner-users/invite/<str:token>", views.partner_user_invite_info),
    path("partner-users/<str:user_id>", views.partner_user_detail),

    path("mdf/", views.mdf_list_or_create),
    path("mdf/stats", views.mdf_stats),
    path("mdf/<str:mdf_id>", views.mdf_detail),

    path("rewards/stats", views.rewards_stats),
    path("rewards/redemptions", views.redemptions_list_or_create),
    path("rewards/redemptions/<str:redemption_id>", views.redemption_detail),
    path("rewards/points", views.rewards_adjust_points),
    path("rewards/", views.rewards_list_or_create),
    path("rewards/<str:reward_id>", views.reward_detail),

    path("conflicts/stats", views.conflicts_stats),
    path("conflicts/", views.conflicts_list_or_create),
    path("conflicts/<str:conflict_id>", views.conflict_detail),

    path("communications/stats", views.communications_stats),
    path("communications/", views.communications_list_or_create),
    path("communications/<str:comm_id>", views.communication_detail),

    path("admin/login-attempts", views.admin_login_attempts),
    path("admin/blacklisted-tokens", views.admin_blacklisted_tokens),
    path("admin/blacklisted-tokens/<str:jti>", views.admin_blacklisted_tokens),
    path("admin/register-admin", views.admin_register_admin),

    path("calculator/settings", views.calculator_settings),
    path("calculator/export", views.calculator_export),
]
